from django.db import models
from django.conf import settings

# Create your models here.
class Category(models.Model):
    name = models.CharField(max_length=100)
    slug = models.SlugField(unique=True)
    def __str__(self):
        return self.title

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
    category = models.ForeignKey(Category, on_delete=models.SET_NULL, null=True)
    cover_image_url = models.URLField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.name
    
class Cart(models.Model):
    user = models.OneToOneField(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)

    def __str__(self):
        return f"Cart ({self.user})"
    
class CartItem(models.Model):
    cart = models.ForeignKey(Cart, related_name='items', on_delete=models.CASCADE)
    book = models.ForeignKey(Book, on_delete=models.CASCADE)
    quantity = models.PositiveIntegerField(default=1)

    def __str__(self):
        return f"{self.quantity} x {self.book.title}"

class Order(models.Model):
    DELIVERY_METHOD = [('pickup', 'Pickup'), ('delivery', 'Delivery')]
    DELIVERY_STATUS = [('pending', 'Pending'), ('dispatched', 'Dispatched'), ('delivered', 'Delivered')]
    PAYMENT_STATUS = [('pending', 'Pending'), ('paid', 'Paid'), ('failed', 'Failed')]

    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    total = models.DecimalField(max_digits=10, decimal_places=2)
    payment_status = models.CharField(max_length=20, choices=PAYMENT_STATUS, default='pending')
    delivery_method = models.CharField(max_length=20, choices=DELIVERY_METHOD)
    delivery_address = models.CharField(max_length=255, blank=True)
    delivery_fee = models.DecimalField(max_digits=8, decimal_places=2, default=0)
    delivery_status = models.CharField(max_length=20, choices=DELIVERY_STATUS, default='pending')
    created_at = models.DateTimeField(auto_now_add=True)