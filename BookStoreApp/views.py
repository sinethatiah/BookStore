from django.shortcuts import render
from rest_framework import viewsets
from .models import Book, Category
from .serializers import BookSerializer, CategorySerializer

# Create your views here.

class BookViewSet(viewsets.ModelViewSet):
    queryset = Book.objects.all()
    serializer_class = BookSerializer

class CategoryViewSet(viewsets.ModelViewSet):
    queryset = Category.objects.all()
    serializer_class = CategorySerializer