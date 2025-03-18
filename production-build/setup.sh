#!/bin/bash
npm install
npx prisma generate
npm run build
echo "Setup complete! Run 'npm start' to start the server."
