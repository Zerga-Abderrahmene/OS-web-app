from django.shortcuts import render
from django.http import HttpResponse, JsonResponse
from django.views.decorators.csrf import csrf_exempt
import requests
import urllib.parse
from urllib.parse import urlparse

def desktop_view(request):
    return render(request, 'desktop/desktop.html')

@csrf_exempt
def proxy_view(request):
    """Proxy view to handle web requests and bypass CORS"""
    if request.method == 'GET':
        url = request.GET.get('url')
        if not url:
            return JsonResponse({'error': 'No URL provided'}, status=400)
        
        try:
            # Add headers to mimic a real browser
            headers = {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
                'Accept-Language': 'en-US,en;q=0.5',
                'Accept-Encoding': 'gzip, deflate',
                'Connection': 'keep-alive',
                'Upgrade-Insecure-Requests': '1',
            }
            
            # Make the request
            response = requests.get(url, headers=headers, timeout=10)
            
            # Get the content
            content = response.content
            
            # Create response with appropriate headers
            proxy_response = HttpResponse(content, content_type=response.headers.get('content-type', 'text/html'))
            
            # Copy relevant headers
            for header, value in response.headers.items():
                if header.lower() not in ['content-encoding', 'content-length', 'transfer-encoding']:
                    proxy_response[header] = value
            
            return proxy_response
            
        except requests.RequestException as e:
            return JsonResponse({'error': f'Failed to fetch URL: {str(e)}'}, status=500)
        except Exception as e:
            return JsonResponse({'error': f'Unexpected error: {str(e)}'}, status=500)
    
    return JsonResponse({'error': 'Method not allowed'}, status=405)

def search_view(request):
    """Handle search requests"""
    query = request.GET.get('q', '')
    if not query:
        return JsonResponse({'error': 'No search query provided'}, status=400)
    
    # Mock search results for demonstration
    search_results = [
        {
            'title': f'Search results for "{query}"',
            'url': f'https://www.google.com/search?q={urllib.parse.quote(query)}',
            'snippet': f'About 1,000,000 results for "{query}" (0.45 seconds)'
        },
        {
            'title': f'First Result for {query}',
            'url': f'https://example.com/first-result-{query}',
            'snippet': f'This is the first search result for "{query}". It contains relevant information about the search term.'
        },
        {
            'title': f'Second Result for {query}',
            'url': f'https://example.com/second-result-{query}',
            'snippet': f'Another relevant result for "{query}". This provides additional information and context.'
        },
        {
            'title': f'Third Result for {query}',
            'url': f'https://example.com/third-result-{query}',
            'snippet': f'The third search result for "{query}". More information and details about the topic.'
        }
    ]
    
    return JsonResponse({'results': search_results})
