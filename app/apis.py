from rest_framework import viewsets, routers
from app.models import Spot, Count
from app.serializers import SpotSerializer, CountSerializer

class PostViewSet(viewsets.ModelViewSet):
    queryset = Spot.objects.all()
    serializer_class = SpotSerializer

class CountViewSet(viewsets.ModelViewSet):
    queryset = Count.objects.all()
    serializer_class = CountSerializer

router = routers.DefaultRouter()
router.register(r'spots', PostViewSet)
router.register(r'counts', CountViewSet)