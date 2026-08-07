from django.shortcuts import render
from django.db import transaction
from decimal import Decimal, InvalidOperation
from rest_framework.exceptions import ValidationError
from rest_framework import status
from rest_framework.response import Response
from rest_framework import viewsets
from rest_framework.permissions import IsAuthenticated, AllowAny
from .models import Book, Category,  Order, OrderItem , Cart , CartItem , Favorite ,StockNotification
from .serializers import BookSerializer, CategorySerializer , OrderSerializer, OrderItemSerializer ,CartSerializer, CartItemSerializer , FavoriteSerializer , StockNotificationSerializer
from .permissions import IsAdminRole
from rest_framework.decorators import action
# Create your views here.

class BookViewSet(viewsets.ModelViewSet):
    queryset = Book.objects.all()
    serializer_class = BookSerializer

    def get_permissions(self):
        if self.action in ['list', 'retrieve']:
            return [AllowAny()]
        if self.action == 'notify_me':
            return [IsAuthenticated()]
        return [IsAdminRole()]

    @action(detail=True, methods=['post'])
    def notify_me(self, request, pk=None):
        book = self.get_object()
        notification, created = StockNotification.objects.get_or_create(
            user=request.user, book=book
        )
        if created:
            return Response({'detail': 'You will be notified when this book is back in stock.'}, status=status.HTTP_201_CREATED)
        return Response({'detail': 'You are already subscribed for this book.'}, status=status.HTTP_200_OK)

class CategoryViewSet(viewsets.ModelViewSet):
    queryset = Category.objects.all()
    serializer_class = CategorySerializer

    def get_permissions(self):
        if self.action in ['list', 'retrieve']:
            return [AllowAny()]
        return [IsAdminRole()]

class CartViewSet(viewsets.ModelViewSet):
    serializer_class = CartSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return Cart.objects.filter(user=self.request.user)

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)


class CartItemViewSet(viewsets.ModelViewSet):
    serializer_class = CartItemSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return CartItem.objects.filter(cart__user=self.request.user)

    def perform_create(self, serializer):
        cart, _ = Cart.objects.get_or_create(user=self.request.user)
        serializer.save(cart=cart)

class OrderViewSet(viewsets.ModelViewSet):
    serializer_class = OrderSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        if self.request.user.role == 'admin':
            return Order.objects.all()
        return Order.objects.filter(user=self.request.user)

    def create(self, request, *args, **kwargs):
        user = request.user
        cart = Cart.objects.filter(user=user).first()
        if not cart or not cart.items.exists():
            raise ValidationError({'detail': 'Your cart is empty.'})

        delivery_method = request.data.get('delivery_method')
        delivery_address = request.data.get('delivery_address', '')
        delivery_fee_raw = request.data.get('delivery_fee', 0)

        if delivery_method not in ['pickup', 'delivery']:
            raise ValidationError({'delivery_method': 'Must be "pickup" or "delivery".'})

        # parse delivery_fee to Decimal safely
        try:
            delivery_fee = Decimal(str(delivery_fee_raw))
        except (InvalidOperation, TypeError):
            raise ValidationError({'delivery_fee': 'Must be a valid decimal number.'})
        if delivery_fee < 0:
            raise ValidationError({'delivery_fee': 'Must be non-negative.'})

        with transaction.atomic():
            # group quantities per book (handles duplicate cart items)
            cart_items = list(cart.items.select_related('book'))
            book_qty = {}
            for ci in cart_items:
                if ci.quantity <= 0:
                    raise ValidationError({'quantity': 'Quantity must be a positive integer.'})
                book_id = ci.book_id
                book_qty[book_id] = book_qty.get(book_id, 0) + ci.quantity

            # lock all involved book rows in one query
            book_ids = list(book_qty.keys())
            books = Book.objects.select_for_update().filter(pk__in=book_ids)
            books_map = {b.pk: b for b in books}
            if len(books_map) != len(book_ids):
                missing = set(book_ids) - set(books_map.keys())
                raise ValidationError({'detail': f'Books not found: {missing}'})

            total = Decimal('0')
            for bid, qty in book_qty.items():
                book = books_map[bid]
                if book.stock < qty:
                    raise ValidationError({
                        'detail': f'Not enough stock for "{book.title}". Only {book.stock} left.'
                    })
                total += (book.price * qty)

            total += delivery_fee

            order = Order.objects.create(
                user=user,
                total=total,
                delivery_method=delivery_method,
                delivery_address=delivery_address,
                delivery_fee=delivery_fee
            )

            # create OrderItems and decrement stock
            for bid, qty in book_qty.items():
                book = books_map[bid]
                OrderItem.objects.create(
                    order=order,
                    book=book,
                    quantity=qty,
                    price_at_purchase=book.price
                )
                book.stock -= qty
                if book.stock <= 0:
                    book.status = 'out_of_stock'
                book.save()

            # clear cart
            cart.items.all().delete()

        serializer = self.get_serializer(order)
        return Response(serializer.data, status=status.HTTP_201_CREATED)

    @action(detail=True, methods=['patch'])
    def update_delivery_status(self, request, pk=None):
        order = self.get_object()
        new_status = request.data.get('delivery_status')

        valid_statuses = ['pending', 'dispatched', 'delivered']
        if new_status not in valid_statuses:
            raise ValidationError({'delivery_status': f'Must be one of {valid_statuses}.'})

        order.delivery_status = new_status
        order.save()

        serializer = self.get_serializer(order)
        return Response(serializer.data, status=status.HTTP_200_OK)
class OrderItemViewSet(viewsets.ModelViewSet):
    serializer_class = OrderItemSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        if self.request.user.role == 'admin':
            return OrderItem.objects.all()
        return OrderItem.objects.filter(order__user=self.request.user)
class FavoriteViewSet(viewsets.ModelViewSet):
    serializer_class = FavoriteSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return Favorite.objects.filter(user=self.request.user)

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)

class StockNotificationViewSet(viewsets.ModelViewSet):
    serializer_class = StockNotificationSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return StockNotification.objects.filter(user=self.request.user)

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)