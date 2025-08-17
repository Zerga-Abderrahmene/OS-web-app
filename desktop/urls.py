from django.urls import path
from . import views

urlpatterns = [
    path('', views.desktop_view, name='desktop'),
    path('proxy/', views.proxy_view, name='proxy'),
    path('search/', views.search_view, name='search'),
]
