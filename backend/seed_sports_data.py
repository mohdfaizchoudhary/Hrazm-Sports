import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from categories.models import Category, SubCategory
from products.models import Product
from django.utils.text import slugify


def run_seed():
    print("Flushing and re-seeding full sports catalog...")
    Product.objects.all().delete()
    SubCategory.objects.all().delete()
    Category.objects.all().delete()

    structure = {
        "Footwear": [
            "Men's Casual Shoes",
            "Running Shoes",
            "Football Studs",
            "Cricket Spikes",
            "Trekking Boots"
        ],
        "Cricket": [
            "English Willow Bats",
            "Leather Match Balls",
            "Batting Pads & Gloves",
            "Cricket Whites & Apparel"
        ],
        "Football": [
            "Official Match Balls",
            "Shin Guards",
            "Goalkeeper Gloves",
            "Jerseys & Club Kits"
        ],
        "Gym & Fitness": [
            "Dumbbells & Weight Plates",
            "Resistance Bands & Grippers",
            "Workout Trackpants & Shorts",
            "Lifting Belts & Straps"
        ],
        "Badminton": [
            "Graphite Rackets",
            "Feather & Nylon Shuttles",
            "Badminton Court Shoes",
            "Racket Kit Bags"
        ],
        "Trekking & Outdoor": [
            "Hiking Backpacks 40L-70L",
            "Trekking Poles & Sticks",
            "Waterproof Ponchos & Raincoats",
            "Camping Tents"
        ],
        "Cycling": [
            "Aerodynamic Helmets",
            "Padded Cycling Shorts",
            "Cycling Gloves",
            "High Pressure Pumps"
        ],
        "Combat Sports": [
            "Boxing Sparring Gloves",
            "Elastic Hand Wraps",
            "Heavy Punching Bags",
            "Protective Mouthguards"
        ]
    }

    cat_map = {}
    sub_map = {}

    for cat_name, sub_names in structure.items():
        cat = Category.objects.create(name=cat_name, slug=slugify(cat_name))
        cat_map[cat_name] = cat
        for sub_name in sub_names:
            sub = SubCategory.objects.create(category=cat, name=sub_name, slug=slugify(sub_name))
            sub_map[f"{cat_name}_{sub_name}"] = sub
            print(f"✔ Category tree: {cat.name} -> {sub.name}")

    sample_items = [
        {
            "name": "Kiprun Ultra Light Carbon Plate Running Shoes",
            "cat": "Footwear",
            "sub": "Running Shoes",
            "gender": "Men",
            "brand": "KIPRUN",
            "type": "shoes",
            "price": 4499.00,
            "discount": 2999.00,
            "sizes": "7,8,9,10,11",
            "colors": "Black,Navy Blue,White",
            "rating": 4.6,
            "img": "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=600"
        },
        {
            "name": "Kipsta Hardground Moulded Turf Football Shoes",
            "cat": "Footwear",
            "sub": "Football Studs",
            "gender": "Men",
            "brand": "KIPSTA",
            "type": "shoes",
            "price": 2799.00,
            "discount": 1899.00,
            "sizes": "6,7,8,9,10",
            "colors": "Black,Red,White",
            "rating": 4.5,
            "img": "https://images.unsplash.com/photo-1511886929837-354d827aae26?w=600"
        },
        {
            "name": "Quechua Waterproof High-Ankle Mountain Boots",
            "cat": "Footwear",
            "sub": "Trekking Boots",
            "gender": "Unisex",
            "brand": "QUECHUA",
            "type": "shoes",
            "price": 4999.00,
            "discount": 3499.00,
            "sizes": "7,8,9,10,11",
            "colors": "Olive,Black,Brown",
            "rating": 4.7,
            "img": "https://images.unsplash.com/photo-1520639888713-7851133b1ed0?w=600"
        },
        {
            "name": "FLX Master Grade English Willow Power Bat",
            "cat": "Cricket",
            "sub": "English Willow Bats",
            "gender": "Unisex",
            "brand": "FLX",
            "type": "equipment",
            "price": 8999.00,
            "discount": 5999.00,
            "sizes": "",
            "colors": "Natural Wood",
            "rating": 4.8,
            "img": "https://images.unsplash.com/photo-1531415074968-036ba1b575da?w=600"
        },
        {
            "name": "Domyos Cast Iron Hexagonal Dumbbells Pair (10KG)",
            "cat": "Gym & Fitness",
            "sub": "Dumbbells & Weight Plates",
            "gender": "Unisex",
            "brand": "DOMYOS",
            "type": "equipment",
            "price": 3499.00,
            "discount": 2499.00,
            "sizes": "",
            "colors": "Black",
            "rating": 4.4,
            "img": "https://images.unsplash.com/photo-1586401100295-7a8096fd231a?w=600"
        },
        {
            "name": "Perfly High Modulus Carbon Badminton Racket",
            "cat": "Badminton",
            "sub": "Graphite Rackets",
            "gender": "Unisex",
            "brand": "PERFLY",
            "type": "equipment",
            "price": 2499.00,
            "discount": 1699.00,
            "sizes": "",
            "colors": "Blue,Red,Black",
            "rating": 4.3,
            "img": "https://images.unsplash.com/photo-1626224583764-f87db24ac4ea?w=600"
        },
        {
            "name": "Men's Performance Quick-Dry Running T-Shirt",
            "cat": "Footwear",
            "sub": "Men's Casual Shoes",
            "gender": "Men",
            "brand": "KIPRUN",
            "type": "clothing",
            "price": 1199.00,
            "discount": 699.00,
            "sizes": "S,M,L,XL,XXL",
            "colors": "Black,Navy Blue,Grey",
            "rating": 4.5,
            "img": "https://images.unsplash.com/photo-1521572267360-ee0c2909d518?w=600"
        }
    ]

    for item in sample_items:
        Product.objects.create(
            name=item["name"],
            category=cat_map[item["cat"]],
            subcategory=sub_map[f"{item['cat']}_{item['sub']}"],
            gender=item["gender"],
            brand=item["brand"],
            product_type=item["type"],
            price=item["price"],
            discount_price=item["discount"],
            available_sizes=item["sizes"],
            available_colors=item["colors"],
            rating=item["rating"],
            image_url=item["img"],
            description=f"Authentic {item['name']} engineered for competition and athletic training."
        )

    print("Seeding complete.")


if __name__ == '__main__':
    run_seed()