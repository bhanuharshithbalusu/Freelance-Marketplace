/**
 * Database Seeding Script
 * Populates the database with realistic sample data
 * - Multiple clients and freelancers
 * - Various projects in different states
 * - Bids from different freelancers
 * - Some projects assigned, some open, some closed
 */

import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import User from '../models/User.js';
import Project from '../models/Project.js';
import Bid from '../models/Bid.js';
import dotenv from 'dotenv';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/freelance-marketplace';

// Sample users data
const clients = [
  {
    name: 'TechStart Inc',
    email: 'contact@techstart.com',
    password: 'password123',
    role: 'CLIENT'
  },
  {
    name: 'Digital Ventures',
    email: 'hello@digitalventures.io',
    password: 'password123',
    role: 'CLIENT'
  },
  {
    name: 'Creative Studios',
    email: 'info@creativestudios.com',
    password: 'password123',
    role: 'CLIENT'
  },
  {
    name: 'StartupXYZ',
    email: 'team@startupxyz.com',
    password: 'password123',
    role: 'CLIENT'
  }
];

const freelancers = [
  {
    name: 'Sarah Chen',
    email: 'sarah.chen@freelancer.com',
    password: 'password123',
    role: 'FREELANCER'
  },
  {
    name: 'Marcus Johnson',
    email: 'marcus.j@developer.io',
    password: 'password123',
    role: 'FREELANCER'
  },
  {
    name: 'Emma Rodriguez',
    email: 'emma.r@designer.net',
    password: 'password123',
    role: 'FREELANCER'
  },
  {
    name: 'David Kim',
    email: 'david.kim@coder.dev',
    password: 'password123',
    role: 'FREELANCER'
  },
  {
    name: 'Olivia Martinez',
    email: 'olivia.m@webdev.com',
    password: 'password123',
    role: 'FREELANCER'
  },
  {
    name: 'James Wilson',
    email: 'james.w@fullstack.io',
    password: 'password123',
    role: 'FREELANCER'
  }
];

// Sample projects data
const projectsData = [
  {
    title: 'E-Commerce Website Development',
    description: 'Looking for an experienced web developer to build a modern e-commerce platform with shopping cart, payment integration, and admin dashboard. Must have experience with React and Node.js.',
    category: 'Web Development',
    budget: { min: 3000, max: 5000 },
    requiredSkills: ['react', 'node.js', 'mongodb', 'stripe'],
    daysFromNow: 15,
    status: 'ASSIGNED' // Will be assigned to a winning freelancer
  },
  {
    title: 'Mobile App UI/UX Design',
    description: 'Need a talented designer to create a clean, modern UI/UX for our fitness tracking mobile app. Should include wireframes, mockups, and a complete design system.',
    category: 'Design',
    budget: { min: 1500, max: 2500 },
    requiredSkills: ['figma', 'ui/ux', 'mobile design', 'design systems'],
    daysFromNow: 10,
    status: 'ASSIGNED'
  },
  {
    title: 'WordPress Blog Migration',
    description: 'Migrate existing WordPress blog to a new hosting provider with minimal downtime. Need someone experienced with WordPress, cPanel, and DNS management.',
    category: 'Web Development',
    budget: { min: 500, max: 800 },
    requiredSkills: ['wordpress', 'cpanel', 'dns', 'mysql'],
    daysFromNow: 7,
    status: 'OPEN' // Currently accepting bids
  },
  {
    title: 'Python Data Analysis Script',
    description: 'Build a Python script to analyze sales data from CSV files and generate comprehensive reports with visualizations. Must include pandas and matplotlib.',
    category: 'Programming',
    budget: { min: 800, max: 1200 },
    requiredSkills: ['python', 'pandas', 'matplotlib', 'data analysis'],
    daysFromNow: 12,
    status: 'OPEN'
  },
  {
    title: 'React Native Mobile App',
    description: 'Develop a cross-platform mobile app for restaurant food ordering. Features include menu browsing, cart management, order tracking, and payment integration.',
    category: 'Mobile Development',
    budget: { min: 4000, max: 6000 },
    requiredSkills: ['react native', 'javascript', 'firebase', 'payment gateway'],
    daysFromNow: 20,
    status: 'OPEN'
  },
  {
    title: 'SEO Optimization for SaaS Website',
    description: 'Optimize our SaaS landing page for search engines. Need on-page SEO, keyword research, meta tags optimization, and performance improvements.',
    category: 'Marketing',
    budget: { min: 600, max: 1000 },
    requiredSkills: ['seo', 'google analytics', 'content writing', 'marketing'],
    daysFromNow: 8,
    status: 'ASSIGNED'
  },
  {
    title: 'Logo Design for Tech Startup',
    description: 'Create a modern, minimalist logo for our AI-powered tech startup. Need multiple concepts, revisions included, and final files in all formats.',
    category: 'Design',
    budget: { min: 300, max: 600 },
    requiredSkills: ['logo design', 'adobe illustrator', 'branding', 'typography'],
    daysFromNow: 5,
    status: 'CLOSED' // Deadline passed
  },
  {
    title: 'API Integration for CRM System',
    description: 'Integrate third-party APIs (Salesforce, Mailchimp, Slack) into our existing CRM system. Must have experience with REST APIs and webhook handling.',
    category: 'Web Development',
    budget: { min: 2000, max: 3500 },
    requiredSkills: ['api integration', 'node.js', 'rest', 'webhooks'],
    daysFromNow: 18,
    status: 'OPEN'
  }
];

// Sample bids data (will be generated based on projects)
const generateBidsForProject = (project, freelancers, projectIndex) => {
  const bids = [];
  
  // Number of bids per project (2-5 bids)
  const numBids = Math.floor(Math.random() * 4) + 2;
  
  // Select random freelancers
  const selectedFreelancers = [...freelancers]
    .sort(() => Math.random() - 0.5)
    .slice(0, numBids);
  
  selectedFreelancers.forEach((freelancer, index) => {
    // Generate bid amount within project budget range
    const budgetRange = project.budget.max - project.budget.min;
    const bidAmount = project.budget.min + (budgetRange * (0.6 + Math.random() * 0.4));
    
    // Generate realistic proposals
    const proposals = [
      `Hi! I'm ${freelancer.name} and I have extensive experience in ${project.requiredSkills[0]}. I've completed similar projects and can deliver high-quality work within your timeline. I'd love to discuss your requirements in detail.`,
      `Hello! With over 5 years of experience in ${project.category.toLowerCase().replace('_', ' ')}, I'm confident I can deliver exactly what you need. My approach focuses on quality, communication, and timely delivery. Let's make this project a success!`,
      `Greetings! I noticed your project requires ${project.requiredSkills.slice(0, 2).join(' and ')} - these are my core strengths. I've worked on ${Math.floor(Math.random() * 20) + 10}+ similar projects with 100% client satisfaction. Looking forward to working together!`,
      `Hi there! I'm a ${project.category.toLowerCase().replace('_', ' ')} specialist with a proven track record. Your project aligns perfectly with my expertise. I guarantee professional results and excellent communication throughout the process.`,
      `Hello! After reviewing your requirements, I believe I'm the perfect fit for this project. I have strong skills in ${project.requiredSkills.join(', ')} and can start immediately. Let's discuss how I can bring your vision to life!`
    ];
    
    bids.push({
      freelancer,
      amount: Math.round(bidAmount),
      proposal: proposals[index % proposals.length],
      deliveryTime: Math.floor(Math.random() * 20) + 5, // 5-25 days
      isWinning: index === 0 && (project.status === 'ASSIGNED') // First bid wins for assigned projects
    });
  });
  
  // Sort by amount (lowest first)
  return bids.sort((a, b) => a.amount - b.amount);
};

// Connect to database
const connectDB = async () => {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB');
  } catch (error) {
    console.error('❌ MongoDB connection error:', error);
    process.exit(1);
  }
};

// Clear existing data
const clearDatabase = async () => {
  try {
    await User.deleteMany({});
    await Project.deleteMany({});
    await Bid.deleteMany({});
    console.log('✅ Cleared existing data');
  } catch (error) {
    console.error('❌ Error clearing database:', error);
    throw error;
  }
};

// Seed users
const seedUsers = async () => {
  try {
    const hashedPassword = await bcrypt.hash('password123', 10);
    
    // Create clients
    const createdClients = await User.insertMany(
      clients.map(client => ({
        ...client,
        password: hashedPassword
      }))
    );
    console.log(`✅ Created ${createdClients.length} clients`);
    
    // Create freelancers
    const createdFreelancers = await User.insertMany(
      freelancers.map(freelancer => ({
        ...freelancer,
        password: hashedPassword
      }))
    );
    console.log(`✅ Created ${createdFreelancers.length} freelancers`);
    
    return { createdClients, createdFreelancers };
  } catch (error) {
    console.error('❌ Error seeding users:', error);
    throw error;
  }
};

// Seed projects and bids
const seedProjectsAndBids = async (createdClients, createdFreelancers) => {
  try {
    const createdProjects = [];
    
    for (let i = 0; i < projectsData.length; i++) {
      const projectData = projectsData[i];
      const client = createdClients[i % createdClients.length];
      
      // Calculate bidding deadline
      const biddingEndsAt = new Date();
      biddingEndsAt.setDate(biddingEndsAt.getDate() + projectData.daysFromNow);
      
      // Create project
      const project = await Project.create({
        clientId: client._id,
        title: projectData.title,
        description: projectData.description,
        category: projectData.category,
        budget: projectData.budget,
        requiredSkills: projectData.requiredSkills,
        biddingEndsAt,
        status: 'OPEN' // Start as OPEN, we'll update later
      });
      
      // Generate bids for this project
      const bidsData = generateBidsForProject(projectData, createdFreelancers, i);
      
      // Create all bids as PENDING first (project is OPEN)
      const createdBids = [];
      for (const bidData of bidsData) {
        const bid = await Bid.create({
          projectId: project._id,
          freelancerId: bidData.freelancer._id,
          amount: bidData.amount,
          proposal: bidData.proposal,
          deliveryTime: bidData.deliveryTime,
          status: 'PENDING' // All bids start as PENDING
        });
        createdBids.push({ bid, isWinning: bidData.isWinning });
      }
      
      // If project should be assigned, accept the winning bid
      if (projectData.status === 'ASSIGNED') {
        const winningBidData = createdBids.find(b => b.isWinning);
        if (winningBidData) {
          // Accept the winning bid (this will reject all others)
          winningBidData.bid.status = 'ACCEPTED';
          await winningBidData.bid.save();
          
          // Reject all other bids
          await Bid.updateMany(
            { projectId: project._id, _id: { $ne: winningBidData.bid._id } },
            { status: 'REJECTED' }
          );
          
          // Assign project to freelancer
          project.status = 'ASSIGNED';
          project.assignedFreelancerId = winningBidData.bid.freelancerId;
          project.assignedBidId = winningBidData.bid._id;
          project.assignedAt = new Date();
          await project.save();
        }
      }
      
      // Update project status if it should be closed
      if (projectData.status === 'CLOSED') {
        project.status = 'CLOSED';
        await project.save();
      }
      
      createdProjects.push(project);
      console.log(`✅ Created project: ${project.title} (${bidsData.length} bids)`);
    }
    
    return createdProjects;
  } catch (error) {
    console.error('❌ Error seeding projects and bids:', error);
    throw error;
  }
};

// Main seed function
const seedDatabase = async () => {
  try {
    console.log('🌱 Starting database seeding...\n');
    
    // Connect to database
    await connectDB();
    
    // Clear existing data
    console.log('\n📝 Step 1: Clearing existing data...');
    await clearDatabase();
    
    // Seed users
    console.log('\n👥 Step 2: Creating users...');
    const { createdClients, createdFreelancers } = await seedUsers();
    
    // Seed projects and bids
    console.log('\n📋 Step 3: Creating projects and bids...');
    const createdProjects = await seedProjectsAndBids(createdClients, createdFreelancers);
    
    // Summary
    console.log('\n' + '='.repeat(60));
    console.log('✅ DATABASE SEEDING COMPLETE!');
    console.log('='.repeat(60));
    console.log(`\n📊 Summary:`);
    console.log(`   - Clients: ${createdClients.length}`);
    console.log(`   - Freelancers: ${createdFreelancers.length}`);
    console.log(`   - Projects: ${createdProjects.length}`);
    console.log(`   - Bids: ${await Bid.countDocuments()}`);
    
    const openProjects = await Project.countDocuments({ status: 'OPEN' });
    const assignedProjects = await Project.countDocuments({ status: 'ASSIGNED' });
    const closedProjects = await Project.countDocuments({ status: 'CLOSED' });
    
    console.log(`\n📈 Project Status:`);
    console.log(`   - Open: ${openProjects}`);
    console.log(`   - Assigned: ${assignedProjects}`);
    console.log(`   - Closed: ${closedProjects}`);
    
    console.log('\n🔑 Test Login Credentials:');
    console.log('   Client: contact@techstart.com / password123');
    console.log('   Freelancer: sarah.chen@freelancer.com / password123');
    
    console.log('\n✨ Your marketplace is ready to use!\n');
    
  } catch (error) {
    console.error('\n❌ Seeding failed:', error);
    process.exit(1);
  } finally {
    await mongoose.connection.close();
    console.log('👋 Database connection closed');
  }
};

// Run the seeding
seedDatabase();
