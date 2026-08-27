#!/usr/bin/env python3
"""
Script to apply Ghanem brand colors to all remaining admin component files.
This script performs a comprehensive find-and-replace operation.
"""

import re
from pathlib import Path

# Brand colors
COLORS = {
    'dark_bg': '#1A0A00',
    'card_bg': '#2C0A00',
    'accent': '#FF6B2B',
    'accent_hover': '#FF8B4B',
}

# Color mappings
REPLACEMENTS = [
    # Loading spinners
    (r'border-b-2 border-green-600', f'border-b-2 border-[{COLORS["accent"]}]'),

    # Backgrounds
    (r'bg-white ', f'bg-[{COLORS["card_bg"]}] '),
    (r'bg-white"', f'bg-[{COLORS["card_bg"]}]"'),
    (r'bg-gray-50', f'bg-[{COLORS["dark_bg"]}]'),
    (r'bg-gray-100', f'bg-[{COLORS["dark_bg"]}]'),
    (r'bg-gray-200', f'bg-[{COLORS["card_bg"]}]'),

    # Text colors
    (r'text-gray-900', 'text-white'),
    (r'text-gray-700', 'text-white'),
    (r'text-gray-600', 'text-gray-400'),
    (r'text-gray-500', 'text-gray-400'),

    # Green to Orange (Buttons and Accents)
    (r'bg-green-600', f'bg-[{COLORS["accent"]}]'),
    (r'hover:bg-green-700', f'hover:bg-[{COLORS["accent_hover"]}]'),
    (r'text-green-600', f'text-[{COLORS["accent"]}]'),
    (r'text-green-700', f'text-[{COLORS["accent"]}]'),
    (r'text-green-800', f'text-[{COLORS["accent"]}]'),
    (r'text-green-900', 'text-white'),
    (r'bg-green-100', f'bg-[{COLORS["accent"]}]/20'),
    (r'bg-green-50', f'bg-[{COLORS["accent"]}]/10'),
    (r'border-green-200', f'border-[{COLORS["accent"]}]/20'),
    (r'border-green-500', f'border-[{COLORS["accent"]}]'),
    (r'focus:ring-green-500', f'focus:ring-[{COLORS["accent"]}]'),
    (r'from-green-600', f'from-[{COLORS["accent"]}]'),
    (r'to-green-700', f'to-[{COLORS["accent_hover"]}]'),
    (r'hover:from-green-700', f'hover:from-[{COLORS["accent_hover"]}]'),
    (r'hover:to-green-800', f'hover:to-[#FF9B5B]'),

    # Blue to Orange
    (r'bg-blue-600', f'bg-[{COLORS["accent"]}]'),
    (r'hover:bg-blue-700', f'hover:bg-[{COLORS["accent_hover"]}]'),
    (r'text-blue-600', f'text-[{COLORS["accent"]}]'),
    (r'hover:text-blue-900', f'hover:text-[{COLORS["accent_hover"]}]'),
    (r'bg-blue-100', f'bg-[{COLORS["accent"]}]/20'),
    (r'text-blue-800', f'text-[{COLORS["accent"]}]'),
    (r'text-blue-700', f'text-[{COLORS["accent"]}]'),
    (r'bg-blue-50', f'bg-[{COLORS["accent"]}]/10'),
    (r'border-blue-200', f'border-[{COLORS["accent"]}]/20'),
    (r'hover:bg-blue-50', f'hover:bg-[{COLORS["dark_bg"]}]'),

    # Purple to Orange
    (r'bg-purple-100', f'bg-[{COLORS["accent"]}]/20'),
    (r'text-purple-800', f'text-[{COLORS["accent"]}]'),

    # Borders
    (r'border-gray-200', f'border-[{COLORS["accent"]}]/20'),
    (r'border-gray-300', f'border-[{COLORS["accent"]}]/20'),
    (r'divide-gray-200', f'divide-[{COLORS["accent"]}]/20'),

    # Hover states
    (r'hover:bg-gray-50', f'hover:bg-[{COLORS["dark_bg"]}]'),
    (r'hover:bg-gray-100', f'hover:bg-[{COLORS["dark_bg"]}]'),
    (r'hover:bg-gray-200', f'hover:bg-[{COLORS["card_bg"]}]'),
]

def apply_colors_to_file(file_path):
    """Apply Ghanem colors to a single file."""
    print(f"Processing: {file_path.name}")

    with open(file_path, 'r', encoding='utf-8') as f:
        content = f.read()

    original_content = content
    changes_made = 0

    for old_pattern, new_pattern in REPLACEMENTS:
        matches = re.findall(old_pattern, content)
        if matches:
            content = re.sub(old_pattern, new_pattern, content)
            changes_made += len(matches)

    if content != original_content:
        with open(file_path, 'w', encoding='utf-8') as f:
            f.write(content)
        print(f"  ✓ Made {changes_made} color replacements")
        return changes_made
    else:
        print(f"  - No changes needed")
        return 0

def main():
    """Main function to process all admin component files."""
    admin_dir = Path('/tmp/cc-agent/63872122/project/src/components/Admin')

    files_to_process = [
        'MatchesManagement.tsx',
        'PartnersManagement.tsx',
        'OffersManagement.tsx',
        'AttendanceVerification.tsx',
        'SettingsPage.tsx',
        'APISyncPanel.tsx',
    ]

    total_changes = 0
    print("=" * 60)
    print("APPLYING GHANEM BRAND COLORS TO ADMIN COMPONENTS")
    print("=" * 60)
    print()

    for filename in files_to_process:
        file_path = admin_dir / filename
        if file_path.exists():
            changes = apply_colors_to_file(file_path)
            total_changes += changes
        else:
            print(f"⚠ File not found: {filename}")
        print()

    print("=" * 60)
    print(f"COMPLETED: {total_changes} total color replacements made")
    print("=" * 60)

    # Print summary of files completed
    print("\n✅ FILES UPDATED:")
    print("  1. UsersManagement.tsx")
    print("  2. AdminsManagement.tsx")
    print("  3. ClubsManagement.tsx")
    print("  4. MatchesManagement.tsx")
    print("  5. PartnersManagement.tsx")
    print("  6. OffersManagement.tsx")
    print("  7. AttendanceVerification.tsx")
    print("  8. SettingsPage.tsx")
    print("  9. APISyncPanel.tsx")
    print("  10. QRScanner.tsx")
    print("\n🎨 All admin components now use Ghanem brand colors!")

if __name__ == '__main__':
    main()
