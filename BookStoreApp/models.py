from django.db import models

# Create your models here.

class Book(models.Model):
    STATUS_CHOICES = [
        ('in_stock', 'In Stock'),
        ('pre_order', 'Pre-order'),
        ('out_of_stock', 'Out of Stock'),
    ]
    title = models.CharField(max_length=255)
    author = models.CharField(max_length=255)
    isbn = models.CharField(max_length=20, blank=True)
    description = models.TextField(blank=True)
    price = models.DecimalField(max_digits=8, decimal_places=2)
    stock = models.PositiveIntegerField(default=0)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='in_stock')
    cover_image_url = models.URLField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)