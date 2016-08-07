from django.conf.urls import url, include
from app import apis
from . import views

urlpatterns = [
    url(r'^$', views.index, name='index'),
    url(r'^api/', include(apis.router.urls)),
]
