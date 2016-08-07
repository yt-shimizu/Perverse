from django.conf.urls import url
from app import views

urlpatterns = [
    url(r'^$', views.index, name='index'),
    # スポット
    url(r'^v1/spots/$', views.spot_list, name='spot_list'),     # 一覧
]