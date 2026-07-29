from rest_framework.routers import DefaultRouter
from .views import BookViewSet, CategoryViewSet,OrderViewSet, OrderItemViewSet ,CartViewSet, CartItemViewSet , FavoriteViewSet ,StockNotificationViewSet

router = DefaultRouter()
router.register('books', BookViewSet)
router.register('categories', CategoryViewSet)
router.register('orders', OrderViewSet, basename='order')
router.register('order-items', OrderItemViewSet, basename='orderitem')
router.register('cart', CartViewSet, basename='cart')
router.register('cart-items', CartItemViewSet, basename='cartitem')
router.register('favorites', FavoriteViewSet, basename='favorite')
router.register('stock-notifications', StockNotificationViewSet, basename='stocknotification')

urlpatterns = router.urls