from django.conf.urls import url
from app import views

urlpatterns = [
    # スポット
    url(r'^v1/spots/$', views.spot_list, name='spot_list'),     # 一覧
]