from django.contrib import admin
from .models import *

# Register your models here.

admin.site.register(Category)
admin.site.register(Book)
admin.site.register(Cart)
admin.site.register(CartItem)
admin.site.register(Order)
admin.site.register(Favorite)
admin.site.register(StockNotification)