from rest_framework.routers import DefaultRouter
from .views import BookViewSet, CategoryViewSet,OrderViewSet, OrderItemViewSet

router = DefaultRouter()
router.register('books', BookViewSet)
router.register('categories', CategoryViewSet)
router.register('orders', OrderViewSet)
router.register('order-items', OrderItemViewSet)

urlpatterns = router.urls