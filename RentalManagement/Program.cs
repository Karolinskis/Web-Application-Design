using System;
using System.IO;
using System.Reflection;
using Microsoft.OpenApi.Models;

using O9d.AspNet.FluentValidation;
using FluentValidation.AspNetCore;
using FluentValidation;

using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Identity;
using Microsoft.IdentityModel.Tokens;

using Microsoft.EntityFrameworkCore;
using RentalManagement.Contexts;
using System.Text;
using RentalManagement.Entities;
using RentalManagement.Auth;

namespace RentalManagement
{
    public class Program
    {
        public static void Main(string[] args)
        {
            var builder = WebApplication.CreateBuilder(args);

            builder.Services.AddDbContext<AppDbContext>(options =>
                options.UseNpgsql(builder.Configuration.GetConnectionString("PostgreSql")));

            builder.Services.AddValidatorsFromAssemblyContaining<Program>();
            builder.Services.AddFluentValidationAutoValidation().AddFluentValidationClientsideAdapters();

            builder.Services.AddIdentity<User, IdentityRole>(options =>
            {
                options.Password.RequireNonAlphanumeric = false;
                options.Password.RequireUppercase = false;
            })
            .AddEntityFrameworkStores<AppDbContext>()
            .AddDefaultTokenProviders();

            builder.Services.AddAuthentication(options =>
            {
                options.DefaultAuthenticateScheme = JwtBearerDefaults.AuthenticationScheme;
                options.DefaultChallengeScheme = JwtBearerDefaults.AuthenticationScheme;
                options.DefaultScheme = JwtBearerDefaults.AuthenticationScheme;
            })
            .AddJwtBearer(options =>
            {
                options.MapInboundClaims = false;
                options.TokenValidationParameters = new TokenValidationParameters
                {
                    ValidateIssuer = true,
                    ValidateAudience = true,
                    ValidateLifetime = true,
                    ValidateIssuerSigningKey = true,
                    ValidIssuer = builder.Configuration["Jwt:Issuer"],
                    ValidAudience = builder.Configuration["Jwt:Audience"],
                    IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(builder.Configuration["Jwt:Key"]))
                };
            });

            builder.Services.AddAuthorization(options =>
            {
                options.AddPolicy("RequireTenantRole", policy => policy.RequireRole(UserRoles.Tenant));
                options.AddPolicy("RequireOwnerRole", policy => policy.RequireRole(UserRoles.Owner));
                options.AddPolicy("RequireAdminRole", policy => policy.RequireRole(UserRoles.Admin));
            });

            builder.Services.AddControllers();

            builder.Services.AddResponseCaching();
            builder.Services.AddTransient<JwtTokenService>();
            builder.Services.AddTransient<SessionService>();
            builder.Services.AddScoped<AuthSeeder>();

            // Learn more about configuring Swagger/OpenAPI at https://aka.ms/aspnetcore/swashbuckle
            builder.Services.AddEndpointsApiExplorer();
            builder.Services.AddSwaggerGen(options =>
            {
                options.SwaggerDoc("v1", new OpenApiInfo
                {
                    Version = "v1",
                    Title = "RentalManagement API",
                    Description = "An ASP.NET Core Web API for managing rentals",
                });

                var xmlFilename = $"{Assembly.GetExecutingAssembly().GetName().Name}.xml";
                options.IncludeXmlComments(Path.Combine(AppContext.BaseDirectory, xmlFilename));

                options.EnableAnnotations(); // FIXME: Might not be needed. Needed for Swashbuckle Annotations
            });

            builder.Services.AddCors(options =>
            {
                options.AddPolicy("AllowAllOrigins",
                    builder =>
                    {
                        builder.AllowAnyOrigin()
                            .AllowAnyMethod()
                            .AllowAnyHeader();
                    });
            });

            var app = builder.Build();


            // Check database connection
            using (var scope = app.Services.CreateScope())
            {
                var dbContext = scope.ServiceProvider.GetRequiredService<AppDbContext>();
                try
                {
                    // Attempt to query the database
                    dbContext.Database.OpenConnection();
                    dbContext.Database.CloseConnection();
                    app.Logger.LogInformation("Database connection successful");
                }
                catch (Exception ex)
                {
                    app.Logger.LogError(ex, "Database connection failed");
                    throw;
                }
            }

            // Check and create database if it doesn't exist
            using (var scope = app.Services.CreateScope())
            {
                var dbContext = scope.ServiceProvider.GetRequiredService<AppDbContext>();
                try
                {
                    // Ensure the database is created
                    dbContext.Database.EnsureCreated();
                    app.Logger.LogInformation("Database checked and created if it didn't exist");
                }
                catch (Exception ex)
                {
                    app.Logger.LogError(ex, "Database creation/check failed");
                }
            }

            // Seed roles
            using (var scope = app.Services.CreateScope())
            {
                var dbContext = scope.ServiceProvider.GetRequiredService<AppDbContext>();
                var authSeeder = scope.ServiceProvider.GetRequiredService<AuthSeeder>();

                Task.Run(async () => await authSeeder.SeedRoles(scope.ServiceProvider)).GetAwaiter().GetResult();
            }

            // Configure the HTTP request pipeline.
            if (app.Environment.IsDevelopment())
            {
                app.UseDeveloperExceptionPage();
                app.UseSwagger();
                app.UseSwaggerUI(c =>
                {
                    c.SwaggerEndpoint("/swagger/v1/swagger.json", "RentalManagement API v1");
                    c.RoutePrefix = string.Empty;
                });
            }

            app.UseCors("AllowAllOrigins");

            app.UseHttpsRedirection();
            app.UseResponseCaching();
            app.UseAuthentication();
            app.UseAuthorization();
            app.MapControllers();

            app.Run();
        }
    }
}
