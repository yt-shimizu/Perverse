from rest_framework import viewsets, routers
from app.models import Spot
from app.serializers import SpotSerializer

class PostViewSet(viewsets.ModelViewSet):
    queryset = Spot.objects.all()
    serializer_class = SpotSerializer

router = routers.DefaultRouter()
router.register(r'spots', PostViewSet)
