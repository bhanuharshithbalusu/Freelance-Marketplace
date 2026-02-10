/**
 * Passport Configuration
 * Google OAuth Strategy
 */

import dotenv from 'dotenv';
import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import User from '../models/User.js';

// Ensure environment variables are loaded
dotenv.config();

// Configure Google Strategy (only if credentials are provided)
const hasGoogleCredentials = 
  process.env.GOOGLE_CLIENT_ID && 
  process.env.GOOGLE_CLIENT_ID !== 'your-google-client-id-here' &&
  process.env.GOOGLE_CLIENT_SECRET && 
  process.env.GOOGLE_CLIENT_SECRET !== 'your-google-client-secret-here';

if (hasGoogleCredentials) {
  console.log('✅ Google OAuth configured');
  passport.use(
    new GoogleStrategy(
      {
        clientID: process.env.GOOGLE_CLIENT_ID,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET,
        callbackURL: process.env.GOOGLE_CALLBACK_URL,
        scope: ['profile', 'email']
      },
      async (accessToken, refreshToken, profile, done) => {
      try {
        console.log('🔍 Google OAuth callback received');
        console.log('Profile:', {
          id: profile.id,
          email: profile.emails?.[0]?.value,
          name: profile.displayName
        });

        // Check if user already exists
        let user = await User.findOne({ googleId: profile.id });

        if (user) {
          console.log('✅ Existing Google user found:', user.email);
          return done(null, user);
        }

        // Check if user exists with same email
        const email = profile.emails?.[0]?.value;
        user = await User.findOne({ email });

        if (user) {
          console.log('✅ User exists with email, linking Google account');
          // Link Google account to existing user
          user.googleId = profile.id;
          await user.save();
          return done(null, user);
        }

        // Create new user
        console.log('📝 Creating new user from Google profile');
        user = await User.create({
          googleId: profile.id,
          name: profile.displayName,
          email: email,
          // No password needed for OAuth users
          // Set a random password to satisfy schema
          password: Math.random().toString(36).slice(-8) + 'Aa1!',
          role: 'FREELANCER', // Default role, can be changed later
          profilePicture: profile.photos?.[0]?.value
        });

        console.log('✅ New Google user created:', user.email);
        return done(null, user);
      } catch (error) {
        console.error('❌ Google OAuth error:', error);
        return done(error, null);
      }
    }
  )
);
} else {
  console.log('⚠️  Google OAuth not configured - Sign in with Google will not work');
  console.log('   Set GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET in .env to enable');
}

// Serialize user for session
passport.serializeUser((user, done) => {
  done(null, user._id);
});

// Deserialize user from session
passport.deserializeUser(async (id, done) => {
  try {
    const user = await User.findById(id);
    done(null, user);
  } catch (error) {
    done(error, null);
  }
});

export default passport;
