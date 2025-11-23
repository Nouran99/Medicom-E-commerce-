#!/bin/bash
# Generate a secure JWT secret for Medicum Egypt

echo "🔐 Generating secure JWT secret..."
echo ""

# Generate random 32-byte secret and encode as base64
SECRET=$(openssl rand -base64 32)

echo "✅ Generated JWT Secret:"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "$SECRET"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "📋 Copy this secret and add it to:"
echo "   1. .dev.vars (for local development)"
echo "   2. Cloudflare Pages Environment Variables (for production)"
echo ""
echo "⚠️  Keep this secret secure - never commit it to git!"
echo ""
