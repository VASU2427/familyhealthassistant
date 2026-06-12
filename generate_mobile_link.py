import socket
import os
import webbrowser

def get_local_ip():
    s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
    try:
        # Connect to public DNS (does not actually send packets)
        s.connect(('8.8.8.8', 80))
        IP = s.getsockname()[0]
    except Exception:
        IP = '127.0.0.1'
    finally:
        s.close()
    return IP

def main():
    port = 8000
    ip = get_local_ip()
    url = f"http://{ip}:{port}"
    qr_url = f"https://api.qrserver.com/v1/create-qr-code/?size=250x250&data={url}"
    
    html_content = f"""<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Mobile Connection Helper</title>
    <style>
        body {{
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
            background-color: #f0ede6;
            color: #1a1a18;
            margin: 0;
            padding: 1.5rem;
            display: flex;
            align-items: center;
            justify-content: center;
            min-height: 100vh;
        }}
        .card {{
            background: #ffffff;
            border-radius: 24px;
            box-shadow: 0 10px 30px rgba(0, 0, 0, 0.08);
            max-width: 420px;
            width: 100%;
            padding: 2rem 1.5rem;
            text-align: center;
            box-sizing: border-box;
        }}
        h1 {{
            font-size: 1.35rem;
            margin-bottom: 0.5rem;
            color: #0a9e7c;
        }}
        p {{
            font-size: 0.85rem;
            color: #5f5e5a;
            margin-bottom: 1.5rem;
            line-height: 1.5;
        }}
        .qr-image {{
            border: 8px solid #f0ede6;
            border-radius: 16px;
            margin-bottom: 1.25rem;
            max-width: 100%;
            height: auto;
        }}
        .link-badge {{
            display: inline-block;
            background: #e0f5ef;
            color: #0a9e7c;
            padding: 0.6rem 1.25rem;
            border-radius: 50px;
            font-weight: 700;
            font-size: 0.9rem;
            text-decoration: none;
            margin-bottom: 1.5rem;
            transition: opacity 0.2s;
        }}
        .link-badge:hover {{
            opacity: 0.85;
        }}
        ol {{
            text-align: left;
            font-size: 0.8rem;
            color: #5f5e5a;
            padding-left: 1.25rem;
            line-height: 1.6;
            margin-top: 1rem;
        }}
        li {{
            margin-bottom: 0.5rem;
        }}
    </style>
</head>
<body>
    <div class="card">
        <h1>📱 Connect Your Mobile Phone</h1>
        <p>Scan this QR code to load the **Family Health Assistant** on your phone:</p>
        
        <img class="qr-image" src="{qr_url}" alt="QR Link Code" width="220" height="220" />
        
        <br/>
        <a class="link-badge" href="{url}" target="_blank">{url}</a>
        
        <ol>
            <li>Ensure your mobile phone is connected to the <strong>same Wi-Fi network</strong> as your PC.</li>
            <li>Scan the QR code above with your phone's camera app.</li>
            <li>Tap the link to open the app in Safari or Chrome.</li>
            <li><strong>✨ PWA Install Option:</strong> In Safari (iOS), tap the <em>Share</em> button and choose <strong>"Add to Home Screen"</strong>. In Chrome (Android), tap the menu and select <strong>"Install App"</strong>. This pins the app to your home screen so it runs full-screen, offline, and like a native mobile app!</li>
        </ol>
    </div>
</body>
</html>
"""
    
    # Save helper HTML file in the served directory
    helper_path = os.path.join("C:/Users/srinivas/.gemini/antigravity/scratch/Projects/Family Health Assistant", "mobile_connection_helper.html")
    with open(helper_path, "w", encoding="utf-8") as f:
        f.write(html_content)
        
    print(f"Created mobile_connection_helper.html at: {helper_path}")
    
    # Launch browser to localhost:8000/mobile_connection_helper.html
    web_helper_url = "http://localhost:8000/mobile_connection_helper.html"
    print(f"Opening connection helper page at: {web_helper_url}")
    webbrowser.open(web_helper_url)

if __name__ == "__main__":
    main()
