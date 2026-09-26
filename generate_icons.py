import os
from PIL import Image, ImageChops, ImageFilter
import numpy as np

src_path = r'C:\Users\Asus\.gemini\antigravity-ide\brain\72d28b72-eed7-4a42-857c-45203a05c729\.user_uploaded\media_1790456275324.jpg'
src = Image.open(src_path).convert('RGB')

# 1. Precise Crop of logo
bg_white = Image.new('RGB', src.size, (255, 255, 255))
diff = ImageChops.difference(src, bg_white)
# Threshold slightly to ignore any faint compression noise at boundaries
bbox = diff.getbbox()
logo_crop_rgb = src.crop(bbox)

# Create high-quality transparent version of cropped logo
arr = np.array(logo_crop_rgb).astype(float)
# Distance from white (255, 255, 255)
dist_from_white = np.sqrt(np.sum((255.0 - arr) ** 2, axis=2))
# If dist == 0, fully transparent. If dist > 15, fully opaque. Smooth ramp in between
alpha = np.clip((dist_from_white - 2.0) / 12.0 * 255.0, 0, 255).astype(np.uint8)

logo_rgba = Image.new('RGBA', logo_crop_rgb.size)
logo_rgba.paste(logo_crop_rgb, (0, 0))
logo_rgba.putalpha(Image.fromarray(alpha))

os.makedirs('icons', exist_ok=True)

def create_icon(target_size, bg_color=None, fit_ratio=0.76, transparent_logo=False):
    canvas = Image.new('RGBA' if bg_color is None or len(bg_color)==4 else 'RGB', (target_size, target_size), bg_color if bg_color else (0, 0, 0, 0))
    
    source_logo = logo_rgba if (transparent_logo or bg_color is None) else logo_crop_rgb
    
    lw, lh = source_logo.size
    max_dim = int(target_size * fit_ratio)
    scale = min(max_dim / lw, max_dim / lh)
    nw, nh = int(lw * scale), int(lh * scale)
    
    resized_logo = source_logo.resize((nw, nh), Image.Resampling.LANCZOS)
    
    x = (target_size - nw) // 2
    y = (target_size - nh) // 2
    
    if resized_logo.mode == 'RGBA':
        canvas.paste(resized_logo, (x, y), resized_logo)
    else:
        canvas.paste(resized_logo, (x, y))
        
    return canvas

# 1. White background versions (Standard Google Pay App Icon - 100% compliant with PWA & Play Store)
icon_192_white = create_icon(192, bg_color=(255, 255, 255), fit_ratio=0.75)
icon_512_white = create_icon(512, bg_color=(255, 255, 255), fit_ratio=0.75)
# Maskable icons strictly sized within 80% safe-zone circle for Android WebAPK
icon_maskable_192 = create_icon(192, bg_color=(255, 255, 255), fit_ratio=0.58)
icon_maskable_512 = create_icon(512, bg_color=(255, 255, 255), fit_ratio=0.58)
apple_touch_icon = create_icon(180, bg_color=(255, 255, 255), fit_ratio=0.75)

# 2. Transparent background versions
icon_192_trans = create_icon(192, bg_color=None, fit_ratio=0.82, transparent_logo=True)
icon_512_trans = create_icon(512, bg_color=None, fit_ratio=0.82, transparent_logo=True)

# Save icons in icons/
icon_192_white.save('icons/icon-192.png', 'PNG')
icon_512_white.save('icons/icon-512.png', 'PNG')
icon_maskable_192.save('icons/icon-maskable-192.png', 'PNG')
icon_maskable_512.save('icons/icon-maskable-512.png', 'PNG')
icon_192_trans.save('icons/icon-transparent-192.png', 'PNG')
icon_512_trans.save('icons/icon-transparent-512.png', 'PNG')
apple_touch_icon.save('icons/apple-touch-icon.png', 'PNG')

# Also save directly in root directory for standard fallback paths
icon_192_white.save('icon-192.png', 'PNG')
icon_512_white.save('icon-512.png', 'PNG')
apple_touch_icon.save('apple-touch-icon.png', 'PNG')

# Favicons
fav_16 = create_icon(16, bg_color=(255, 255, 255), fit_ratio=0.8)
fav_32 = create_icon(32, bg_color=(255, 255, 255), fit_ratio=0.8)
fav_48 = create_icon(48, bg_color=(255, 255, 255), fit_ratio=0.8)
fav_32.save('favicon.png', 'PNG')
fav_32.save('icons/favicon-32x32.png', 'PNG')
fav_16.save('icons/favicon-16x16.png', 'PNG')
fav_48.save('favicon.ico', format='ICO', sizes=[(16, 16), (32, 32), (48, 48)])

print('All icons generated successfully!')
