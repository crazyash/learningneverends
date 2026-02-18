#!/usr/bin/env python3
import re
import os

# List of emoji characters to remove
emojis = [
    "🏗️", "📊", "✅", "📁", "📄", "❌", "🚀", "📦", "🛠️", "🔧", 
    "🎯", "⚡", "🔄", "🎨", "📋", "👤", "💻", "🏆", "💼", "🔗", 
    "🎓", "🌙", "✨", "📱", "🤝", "📖", "🖥️", "☁️", "🌐", "🏠", 
    "💾", "🏷️", "🏦", "💡", "🛡️"
]

# Create regex pattern
emoji_pattern = '|'.join(re.escape(emoji) for emoji in emojis)

def remove_emojis_from_file(filepath):
    try:
        with open(filepath, 'r', encoding='utf-8') as file:
            content = file.read()
        
        # Remove emojis
        updated_content = re.sub(emoji_pattern, '', content)
        
        # Remove any double spaces that might have been created
        updated_content = re.sub(r'  +', ' ', updated_content)
        
        with open(filepath, 'w', encoding='utf-8') as file:
            file.write(updated_content)
        
        print(f"Processed: {filepath}")
        
    except Exception as e:
        print(f"Error processing {filepath}: {e}")

# Process all Kubernetes markdown files
kubernetes_dir = "/Users/abd1nti/git/learningneverends/articles/kubernetes"
for filename in os.listdir(kubernetes_dir):
    if filename.endswith('.md'):
        filepath = os.path.join(kubernetes_dir, filename)
        remove_emojis_from_file(filepath)

print("Done removing emojis!")
