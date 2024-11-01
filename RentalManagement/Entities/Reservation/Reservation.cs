using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace RentalManagement.Entities;

public class Reservation
{
    public int Id { get; set; }

    public required DateTime CreatedAt { get; set; }
    public required DateTime StartDate { get; set; }
    public required DateTime EndDate { get; set; }
    public required Status Status { get; set; }
    [Range(0, float.MaxValue, ErrorMessage = "Price must be greater than 0.")]
    public required float Price { get; set; }

    public required Place Place { get; set; }
}
