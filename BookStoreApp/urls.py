from rest_framework.routers import DefaultRouter
from .views import BookViewSet, CategoryViewSet,OrderViewSet, OrderItemViewSet ,CartViewSet, CartItemViewSet , FavoriteViewSet

router = DefaultRouter()
router.register('books', BookViewSet)
router.register('categories', CategoryViewSet)
router.register('orders', OrderViewSet)
router.register('order-items', OrderItemViewSet)
router.register('cart', CartViewSet)
router.register('cart-items', CartItemViewSet)
router.register('favorite', FavoriteViewSet)

urlpatterns = router.urls