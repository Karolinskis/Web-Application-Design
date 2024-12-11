using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using O9d.AspNet.FluentValidation;
using RentalManagement.Contexts;
using RentalManagement.Entities;
using RentalManagement.Entities.DTOs;
using Swashbuckle.AspNetCore.Annotations;

namespace RentalManagement.Controllers
{
    [ApiController]
    [Route("api/Places/{placeId}")]
    public class ReviewsController : ControllerBase
    {
        private readonly AppDbContext _context;

        public ReviewsController(AppDbContext context)
        {
            _context = context;
        }

        /// <summary>
        /// Gets all Reviews for a specific Place
        /// </summary>
        /// <param name="placeId">ID of the place</param>
        [SwaggerResponse(StatusCodes.Status200OK, "The Reviews were found.", typeof(IEnumerable<ReviewDTO>))]
        [SwaggerResponse(StatusCodes.Status404NotFound, "The Place was not found.", typeof(ValidationProblemDetails))]
        [HttpGet]
        [Route("[controller]")]
        public async Task<ActionResult<IEnumerable<ReviewDTO>>> GetReviews(int placeId)
        {
            var place = await _context.Places.FindAsync(placeId);
            if (place == null)
                return NotFound("Place not found.");

            var reviews = await _context.Reviews
                                        .Where(r => _context.Reservations
                                                            .Any(res => res.Place.Id == placeId))
                                        .ToListAsync();

            var reviewDtos = reviews.Select(r => new ReviewDTO(
                r.Id,
                r.ReservationId,
                r.Rating,
                r.Comment,
                user: _context.Users.Find(r.UserId)
            )).ToList();

            return Ok(reviewDtos);
        }

        /// <summary>
        /// Gets a Review by the Reservation ID
        /// </summary>
        /// <param name="placeId">ID of the reservation's place</param>
        /// <param name="reservationId">ID of the reservation</param>
        [SwaggerResponse(StatusCodes.Status200OK, "The Review was found.", typeof(ReviewDTO))]
        [SwaggerResponse(StatusCodes.Status404NotFound, "The Review or Place was not found.", typeof(ValidationProblemDetails))]
        [HttpGet]
        [Route("Reservations/{reservationId}/[controller]")]
        public async Task<ActionResult<ReviewDTO>> GetReviewByReservationId(int placeId, int reservationId)
        {
            var place = await _context.Places.FindAsync(placeId);
            if (place == null)
                return NotFound("Place not found.");

            var reservation = await _context.Reservations
                                            .FirstOrDefaultAsync(r => r.Id == reservationId);
            if (reservation == null)
                return NotFound("Reservation not found or does not belong to the specified place.");

            var review = await _context.Reviews
                                    .Include(r => r.Reservation)
                                    .Where(r => r.ReservationId == reservationId)
                                    .FirstOrDefaultAsync();

            if (review == null)
                return NotFound("Review not found.");

            var dto = new ReviewDTO(
                review.Id,
                review.ReservationId,
                review.Rating,
                review.Comment,
                user: _context.Users.Find(review.UserId)
            );

            return Ok(dto);
        }

        /// <summary>
        /// Creates a new Review
        /// </summary>
        /// <param name="placeId">ID of the place that the reservation was made in</param>
        /// <param name="reservationId">ID of the reservation</param>
        /// <param name="createReviewDto">Review details</param>
        [SwaggerResponse(StatusCodes.Status201Created, "The Review was created.", typeof(ReviewDTO))]
        [SwaggerResponse(StatusCodes.Status400BadRequest, "The Review is invalid.", typeof(ValidationProblemDetails))]
        [SwaggerResponse(StatusCodes.Status401Unauthorized, "You are not authorized to create a review.", typeof(ValidationProblemDetails))]
        [SwaggerResponse(StatusCodes.Status409Conflict, "A review for this reservation already exists.", typeof(ValidationProblemDetails))]
        [SwaggerResponse(StatusCodes.Status404NotFound, "The Place or Reservation was not found.", typeof(ValidationProblemDetails))]
        [HttpPost]
        [Authorize(Roles = UserRoles.Tenant)]
        [Route("Reservations/{reservationId}/[controller]")]
        public async Task<ActionResult<ReviewDTO>> CreateReview(int placeId, int reservationId, [Validate] CreateReviewDTO createReviewDto)
        {
            var place = await _context.Places.FindAsync(placeId);
            if (place == null)
                return NotFound("Place not found.");

            var reservation = await _context.Reservations
                                            .Include(r => r.Place)
                                            .FirstOrDefaultAsync(r => r.Id == reservationId);
            if (reservation == null)
                return NotFound("Reservation not found or does not belong to the specified place.");

            if (!HttpContext.User.IsInRole(UserRoles.Admin) &&
                (reservation.UserId != User.FindFirstValue(JwtRegisteredClaimNames.Sub) ||
                reservation.Place.UserId == User.FindFirstValue(JwtRegisteredClaimNames.Sub)))
                return Forbid();

            var review = new Review
            {
                ReservationId = reservationId,
                Reservation = reservation,
                Rating = createReviewDto.Rating,
                Comment = createReviewDto.Comment,
                UserId = HttpContext.User.FindFirstValue(JwtRegisteredClaimNames.Sub)
            };

            var existingReview = await _context.Reviews
                                        .AnyAsync(r => r.ReservationId == review.ReservationId);

            if (existingReview)
                return Conflict("A review for this reservation already exists.");

            await _context.Reviews.AddAsync(review);
            await _context.SaveChangesAsync();

            return CreatedAtAction(nameof(CreateReview), new { id = review.Id }, review);
        }

        /// <summary>
        /// Updates a Review by ID
        /// </summary>
        /// <param name="placeId">ID of the review's place</param>
        /// <param name="reservationId">ID of the review's reservation</param>
        /// <param name="reviewId">ID of the review</param>
        /// <param name="updateReviewDto">Updated review information</param>
        [SwaggerResponse(StatusCodes.Status200OK, "The Review was updated.", typeof(ReviewDTO))]
        [SwaggerResponse(StatusCodes.Status400BadRequest, "The Review is invalid.", typeof(ValidationProblemDetails))]
        [SwaggerResponse(StatusCodes.Status401Unauthorized, "You are not authorized to update this review.", typeof(ValidationProblemDetails))]
        [SwaggerResponse(StatusCodes.Status403Forbidden, "You are not allowed to update this review.", typeof(ValidationProblemDetails))]
        [SwaggerResponse(StatusCodes.Status404NotFound, "The Review was not found.", typeof(ValidationProblemDetails))]
        [HttpPut]
        [Authorize(Roles = UserRoles.Tenant)]
        [Route("Reservations/{reservationId}/[controller]/{reviewId}")]
        public async Task<ActionResult<ReviewDTO>> UpdateReview(int placeId, int reservationId, int reviewId, [Validate] UpdateReviewDTO updateReviewDto)
        {
            var place = await _context.Places.FindAsync(placeId);
            if (place == null)
                return NotFound("Place not found.");

            var reservation = await _context.Reservations
                                            .Include(r => r.Place)
                                            .FirstOrDefaultAsync(r => r.Id == reservationId);
            if (reservation == null)
                return NotFound("Reservation not found or does not belong to the specified place.");

            var review = await _context.Reviews.FindAsync(reviewId);

            if (review == null)
            {
                return NotFound("Review not found.");
            }

            if (!HttpContext.User.IsInRole(UserRoles.Admin) &&
                (reservation.UserId != User.FindFirstValue(JwtRegisteredClaimNames.Sub) ||
                reservation.Place.UserId == User.FindFirstValue(JwtRegisteredClaimNames.Sub)))
                return Forbid();

            review.Rating = updateReviewDto.Rating;
            review.Comment = updateReviewDto.Comment;

            await _context.SaveChangesAsync();

            return new ReviewDTO(
                review.Id,
                review.ReservationId,
                review.Rating,
                review.Comment,
                user: _context.Users.Find(review.UserId)
            );

        }

        /// <summary>
        /// Deletes a Review by its ID
        /// </summary>
        /// <param name="placeId">ID of the review's place</param>
        /// <param name="reservationId">ID of the review's reservation</param>
        /// <param name="reviewId">ID of the review</param>
        [SwaggerResponse(StatusCodes.Status204NoContent, "The Review was deleted.")]
        [SwaggerResponse(StatusCodes.Status400BadRequest, "The Review does not belong to the specified reservation.", typeof(ValidationProblemDetails))]
        [SwaggerResponse(StatusCodes.Status401Unauthorized, "You are not authorized to delete this review.", typeof(ValidationProblemDetails))]
        [SwaggerResponse(StatusCodes.Status403Forbidden, "You are not allowed to delete this review.", typeof(ValidationProblemDetails))]
        [SwaggerResponse(StatusCodes.Status404NotFound, "The Review was not found.", typeof(ValidationProblemDetails))]
        [HttpDelete]
        [Authorize(Roles = UserRoles.Tenant)]
        [Route("Reservations/{reservationId}/[controller]/{reviewId}")]
        public async Task<ActionResult> DeleteReview(int placeId, int reservationId, int reviewId)
        {
            var place = await _context.Places.FindAsync(placeId);
            if (place == null)
                return NotFound("Place not found.");

            var reservation = await _context.Reservations
                                            .Include(r => r.Place)
                                            .FirstOrDefaultAsync(r => r.Id == reservationId);
            if (reservation == null)
                return NotFound("Reservation not found or does not belong to the specified place.");

            var review = await _context.Reviews.FindAsync(reviewId);
            if (review == null)
                return NotFound("Review not found.");

            if (review.ReservationId != reservationId)
                return BadRequest("Review does not belong to the specified reservation.");

            if (!HttpContext.User.IsInRole(UserRoles.Admin) &&
                (reservation.UserId != User.FindFirstValue(JwtRegisteredClaimNames.Sub) ||
                reservation.Place.UserId == User.FindFirstValue(JwtRegisteredClaimNames.Sub)))
                return Forbid();

            _context.Reviews.Remove(review);
            await _context.SaveChangesAsync();

            return NoContent();
        }
    }
}
