from api.models import Medicine, Inventory

# Clear old data
Inventory.objects.all().delete()
Medicine.objects.all().delete()

medicines = [
    ("Doliprane", "Paracetamol", "tablet", "500mg", 120),
    ("Advil", "Ibuprofen", "tablet", "400mg", 80),
    ("Augmentin", "Amoxicillin", "tablet", "1g", 45),
    ("Efferalgan", "Paracetamol", "syrup", "250mg", 60),
    ("Ventoline", "Salbutamol", "injection", "2mg", 25),
    ("Fucidin", "Fusidic Acid", "cream", "2%", 40),
    ("Amoxil", "Amoxicillin", "tablet", "500mg", 90),
    ("Clamoxyl", "Amoxicillin", "syrup", "250mg", 35),
    ("Nurofen", "Ibuprofen", "tablet", "200mg", 75),
    ("Panadol", "Paracetamol", "tablet", "500mg", 110),
]

for name, generic, form, dosage, quantity in medicines:

    med = Medicine.objects.create(
        name=name,
        generic_name=generic,
        form=form,
        dosage_strength=dosage
    )

    Inventory.objects.create(
        medicine=med,
        quantity=quantity,
        unit="boxes"
    )

print("Database seeded successfully!")