const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const dotenv = require('dotenv');

dotenv.config();

const User = require('./models/User');
const Project = require('./models/Project');
const Bid = require('./models/Bid');
const Notification = require('./models/Notification');

const seedDB = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('MongoDB connected for seeding...');

        // Clear existing data
        await User.deleteMany({});
        await Project.deleteMany({});
        await Bid.deleteMany({});
        await Notification.deleteMany({});
        console.log('Cleared existing data.');

        // Create Users
        const salt = await bcrypt.genSalt(12);
        const hashedPassword = await bcrypt.hash('password123', salt);

        const clients = await User.insertMany([
            {
                name: 'Arjun Mehta',
                email: 'arjun@example.com',
                password: hashedPassword,
                role: 'client',
                bio: 'Founder of a growing SaaS startup. Looking for talented developers and designers to bring ideas to life.',
                location: 'Bangalore, India',
            },
            {
                name: 'Sarah Chen',
                email: 'sarah@example.com',
                password: hashedPassword,
                role: 'client',
                bio: 'Marketing director at a mid-size e-commerce company. Frequently hiring freelancers for content and design work.',
                location: 'San Francisco, USA',
            },
            {
                name: 'Ravi Kumar',
                email: 'ravi@example.com',
                password: hashedPassword,
                role: 'client',
                bio: 'Product manager building fintech solutions. Passionate about clean UI and robust backends.',
                location: 'Hyderabad, India',
            },
        ]);

        const freelancers = await User.insertMany([
            {
                name: 'Priya Sharma',
                email: 'priya@example.com',
                password: hashedPassword,
                role: 'freelancer',
                bio: 'Full-stack developer with 4 years of experience in React, Node.js, and MongoDB. I love building scalable web applications.',
                skills: ['React', 'Node.js', 'MongoDB', 'TypeScript', 'Tailwind CSS'],
                hourlyRate: 45,
                location: 'Mumbai, India',
                rating: 4.8,
                completedProjects: 12,
                portfolio: [
                    { title: 'E-commerce Dashboard', description: 'Built a real-time analytics dashboard for an online store', url: '' },
                    { title: 'Task Management App', description: 'Full-stack Kanban board with drag-and-drop', url: '' },
                ],
            },
            {
                name: 'Daniel Kim',
                email: 'daniel@example.com',
                password: hashedPassword,
                role: 'freelancer',
                bio: 'UI/UX designer and front-end developer. I create user-centered designs that convert. Figma, React, and CSS animations are my tools.',
                skills: ['UI/UX Design', 'Figma', 'React', 'CSS', 'Framer Motion'],
                hourlyRate: 55,
                location: 'Seoul, South Korea',
                rating: 4.9,
                completedProjects: 20,
                portfolio: [
                    { title: 'HealthTech App Redesign', description: 'Redesigned patient portal improving usability by 40%', url: '' },
                    { title: 'SaaS Landing Pages', description: 'Designed and developed 15+ high-converting landing pages', url: '' },
                ],
            },
            {
                name: 'Ananya Reddy',
                email: 'ananya@example.com',
                password: hashedPassword,
                role: 'freelancer',
                bio: 'Mobile app developer specializing in React Native and Flutter. Delivered apps with high downloads on both app stores.',
                skills: ['React Native', 'Flutter', 'Firebase', 'REST APIs', 'Redux'],
                hourlyRate: 50,
                location: 'Chennai, India',
                rating: 4.7,
                completedProjects: 8,
                portfolio: [
                    { title: 'Food Delivery App', description: 'Built a cross-platform food delivery app with real-time tracking', url: '' },
                ],
            },
            {
                name: 'James Wilson',
                email: 'james@example.com',
                password: hashedPassword,
                role: 'freelancer',
                bio: 'Backend engineer and DevOps specialist. Expert in Python, AWS, Docker, and CI/CD pipelines.',
                skills: ['Python', 'AWS', 'Docker', 'PostgreSQL', 'CI/CD'],
                hourlyRate: 60,
                location: 'London, UK',
                rating: 4.6,
                completedProjects: 15,
                portfolio: [
                    { title: 'Microservices Architecture', description: 'Designed and deployed a microservices system for a logistics company', url: '' },
                    { title: 'Data Pipeline', description: 'Built ETL pipeline for a data analytics firm', url: '' },
                ],
            },
            {
                name: 'Neha Patel',
                email: 'neha@example.com',
                password: hashedPassword,
                role: 'freelancer',
                bio: 'Content writer and digital marketing specialist. I help brands tell their story through compelling copy and SEO strategy.',
                skills: ['Content Writing', 'SEO', 'Copywriting', 'Social Media', 'Google Analytics'],
                hourlyRate: 35,
                location: 'Delhi, India',
                rating: 4.5,
                completedProjects: 25,
                portfolio: [
                    { title: 'SaaS Blog Strategy', description: 'Grew organic traffic significantly through content planning over 6 months', url: '' },
                ],
            },
        ]);

        console.log('Created ' + clients.length + ' clients and ' + freelancers.length + ' freelancers.');

        // Create Projects
        const projects = await Project.insertMany([
            // Arjun's projects
            {
                title: 'Build a SaaS Customer Portal with React & Node.js',
                description: 'We need a full-stack customer portal for our SaaS platform. The portal should allow customers to manage their subscriptions, view invoices, submit support tickets, and track usage analytics.\n\nKey requirements:\n- User authentication with email/password and Google OAuth\n- Subscription management (upgrade, downgrade, cancel)\n- Invoice history with PDF download\n- Support ticket system with status tracking\n- Usage analytics dashboard with charts\n- Responsive design that works on all devices\n\nWe have Figma mockups ready. Backend should use Node.js with Express and MongoDB.',
                client: clients[0]._id,
                category: 'Web Development',
                skills: ['React', 'Node.js', 'MongoDB', 'Tailwind CSS', 'REST APIs'],
                budget: { min: 3000, max: 6000 },
                deadline: new Date('2026-04-15'),
                status: 'open',
                bidCount: 3,
            },
            {
                title: 'Mobile App for Internal Team Communication',
                description: 'We need a cross-platform mobile app (iOS & Android) for internal team communication. The app should support real-time messaging, file sharing, channels/groups, and push notifications.\n\nFeatures needed:\n- Real-time chat with typing indicators\n- Create channels and direct messages\n- File and image sharing\n- Push notifications\n- User presence (online/offline status)\n- Search through message history\n\nPreference for React Native or Flutter. Backend API is already built.',
                client: clients[0]._id,
                category: 'Mobile Development',
                skills: ['React Native', 'Flutter', 'Firebase', 'Socket.io'],
                budget: { min: 4000, max: 8000 },
                deadline: new Date('2026-05-01'),
                status: 'in-progress',
                selectedFreelancer: freelancers[2]._id,
                bidCount: 2,
            },

            // Sarah's projects
            {
                title: 'E-commerce Website Redesign with Modern UI',
                description: 'Our e-commerce website needs a complete visual overhaul. The current design feels outdated and conversion rates are dropping. We need a modern, fast, and visually stunning redesign.\n\nScope:\n- Redesign homepage, product listing, product detail, cart, and checkout pages\n- Implement modern animations and micro-interactions\n- Optimize for mobile-first experience\n- Improve page load speed\n- A/B testing ready components\n- Dark mode support\n\nCurrent stack is Next.js with Tailwind CSS. We want to keep the same stack.',
                client: clients[1]._id,
                category: 'UI/UX Design',
                skills: ['Figma', 'Next.js', 'Tailwind CSS', 'UI/UX Design', 'Framer Motion'],
                budget: { min: 2500, max: 5000 },
                deadline: new Date('2026-03-30'),
                status: 'open',
                bidCount: 3,
            },
            {
                title: 'Write SEO-Optimized Blog Content for E-commerce Brand',
                description: 'We need a content writer to create high-quality, SEO-optimized blog posts for our e-commerce brand in the sustainable fashion space.\n\nDeliverables:\n- 12 blog posts (1500-2000 words each)\n- Keyword research for each topic\n- Meta titles and descriptions\n- Internal linking strategy\n- Content calendar for 3 months\n\nTopics will revolve around sustainable fashion, eco-friendly materials, ethical manufacturing, and style guides. The tone should be informative yet approachable.',
                client: clients[1]._id,
                category: 'Content Writing',
                skills: ['SEO', 'Content Writing', 'Copywriting', 'Keyword Research'],
                budget: { min: 800, max: 1500 },
                deadline: new Date('2026-04-20'),
                status: 'in-progress',
                selectedFreelancer: freelancers[4]._id,
                bidCount: 2,
            },
            {
                title: 'Social Media Marketing Campaign for Product Launch',
                description: 'We are launching a new product line and need a comprehensive social media marketing campaign across Instagram, Facebook, and LinkedIn.\n\nWhat we need:\n- Campaign strategy document\n- Content calendar (30 days)\n- 30 social media post designs and captions\n- Hashtag strategy\n- Influencer outreach list\n- Performance tracking setup\n- Weekly performance reports\n\nBudget is for the strategy and content creation only, not ad spend.',
                client: clients[1]._id,
                category: 'Digital Marketing',
                skills: ['Social Media', 'Content Strategy', 'Graphic Design', 'Instagram', 'Analytics'],
                budget: { min: 1200, max: 2500 },
                deadline: new Date('2026-03-25'),
                status: 'open',
                bidCount: 1,
            },

            // Ravi's projects
            {
                title: 'Fintech Dashboard with Real-Time Data Visualization',
                description: 'Building a real-time financial dashboard for our fintech platform. The dashboard needs to display live market data, portfolio performance, transaction history, and risk analytics.\n\nRequirements:\n- Real-time data streaming with WebSockets\n- Interactive charts (candlestick, line, area charts)\n- Portfolio allocation pie charts\n- Transaction history with filtering and export\n- Risk score visualization\n- Responsive design\n- Performance optimized for large datasets\n\nTech stack: React with D3.js or Recharts, Node.js backend with WebSocket support.',
                client: clients[2]._id,
                category: 'Web Development',
                skills: ['React', 'D3.js', 'Node.js', 'WebSocket', 'TypeScript'],
                budget: { min: 5000, max: 10000 },
                deadline: new Date('2026-05-15'),
                status: 'open',
                bidCount: 3,
            },
            {
                title: 'Set Up CI/CD Pipeline and Cloud Infrastructure',
                description: 'We need to set up a production-grade CI/CD pipeline and cloud infrastructure for our fintech application.\n\nScope:\n- AWS infrastructure setup (ECS, RDS, ElastiCache, S3)\n- Terraform for infrastructure as code\n- GitHub Actions CI/CD pipeline\n- Staging and production environments\n- Automated testing integration\n- Monitoring and alerting (CloudWatch, PagerDuty)\n- SSL certificates and domain configuration\n- Security best practices and compliance\n\nMust have experience with financial services compliance requirements.',
                client: clients[2]._id,
                category: 'DevOps',
                skills: ['AWS', 'Docker', 'Terraform', 'CI/CD', 'GitHub Actions'],
                budget: { min: 3500, max: 7000 },
                deadline: new Date('2026-04-10'),
                status: 'completed',
                selectedFreelancer: freelancers[3]._id,
                bidCount: 2,
            },
            {
                title: 'Data Analytics Dashboard for Business Intelligence',
                description: 'We need a data analytics dashboard that connects to our PostgreSQL database and provides business intelligence insights for our operations team.\n\nFeatures:\n- Connect to PostgreSQL and pull data in real-time\n- Revenue and growth trend charts\n- Customer segmentation analysis\n- Automated report generation (PDF/CSV)\n- User role-based access to different data views\n- Date range filters and drill-down capabilities\n\nPrefer Python (Django/Flask) backend with React frontend. Must handle large datasets efficiently.',
                client: clients[2]._id,
                category: 'Data Science',
                skills: ['Python', 'PostgreSQL', 'React', 'Data Visualization', 'Pandas'],
                budget: { min: 4000, max: 8000 },
                deadline: new Date('2026-05-30'),
                status: 'open',
                bidCount: 2,
            },
        ]);

        console.log('Created ' + projects.length + ' projects.');

        // Create Bids
        const bids = await Bid.insertMany([
            // Bids on Project 0: SaaS Customer Portal (open)
            {
                project: projects[0]._id,
                freelancer: freelancers[0]._id,
                amount: 4500,
                deliveryDays: 30,
                proposal: 'Hi Arjun, I have extensive experience building SaaS portals with React and Node.js. I recently built a similar customer dashboard with subscription management and analytics. I can deliver a clean, well-tested codebase with all the features you described. Happy to discuss the Figma mockups in detail.',
                status: 'pending',
            },
            {
                project: projects[0]._id,
                freelancer: freelancers[1]._id,
                amount: 5200,
                deliveryDays: 35,
                proposal: 'I would love to work on this project. My strength is in creating polished UI/UX alongside functional front-ends. I can handle the full-stack development with a focus on making the portal feel premium and intuitive. I have experience with Stripe integration for subscription management.',
                status: 'pending',
            },
            {
                project: projects[0]._id,
                freelancer: freelancers[3]._id,
                amount: 5800,
                deliveryDays: 28,
                proposal: 'I have built multiple SaaS platforms from scratch. My approach would be to set up a solid architecture first with proper authentication, then layer on the features. I can also set up CI/CD and monitoring. The system will be production-ready with proper error handling and logging.',
                status: 'pending',
            },

            // Bids on Project 1: Mobile App (in-progress, Ananya accepted)
            {
                project: projects[1]._id,
                freelancer: freelancers[2]._id,
                amount: 6000,
                deliveryDays: 45,
                proposal: 'I specialize in React Native and have built several real-time communication apps. I can integrate with your existing backend API seamlessly. My approach includes setting up the chat infrastructure with Socket.io, implementing clean channel management, and ensuring push notifications work reliably on both platforms.',
                status: 'accepted',
            },
            {
                project: projects[1]._id,
                freelancer: freelancers[0]._id,
                amount: 5500,
                deliveryDays: 40,
                proposal: 'I have experience with React Native and real-time features. I can build a clean, performant messaging app with all the features you need. I would use Socket.io for real-time messaging and Firebase for push notifications.',
                status: 'rejected',
            },

            // Bids on Project 2: E-commerce Redesign (open)
            {
                project: projects[2]._id,
                freelancer: freelancers[1]._id,
                amount: 4000,
                deliveryDays: 25,
                proposal: 'This is exactly the kind of project I excel at. I have redesigned multiple e-commerce platforms with measurable improvements in conversion rates. I will start with a design audit, create modern Figma mockups, and then implement them in Next.js with Tailwind and Framer Motion for those micro-interactions. Dark mode is something I have implemented many times.',
                status: 'pending',
            },
            {
                project: projects[2]._id,
                freelancer: freelancers[0]._id,
                amount: 3500,
                deliveryDays: 30,
                proposal: 'I can handle both the design and development aspects of this redesign. I have worked with Next.js and Tailwind CSS extensively. I will focus on mobile-first design, performance optimization, and creating reusable components that make A/B testing straightforward.',
                status: 'pending',
            },
            {
                project: projects[2]._id,
                freelancer: freelancers[2]._id,
                amount: 3800,
                deliveryDays: 28,
                proposal: 'While I primarily do mobile development, I also have solid experience with web redesigns using Next.js. I would bring a mobile-first perspective that ensures the e-commerce experience is seamless across all devices. I am comfortable with Framer Motion for animations.',
                status: 'pending',
            },

            // Bids on Project 3: SEO Blog Content (in-progress, Neha accepted)
            {
                project: projects[3]._id,
                freelancer: freelancers[4]._id,
                amount: 1200,
                deliveryDays: 45,
                proposal: 'Sustainable fashion is a topic I am passionate about and have written extensively on. I will conduct thorough keyword research using Ahrefs, create a strategic content calendar, and deliver well-researched articles that rank. Each post will include proper internal linking and meta optimization.',
                status: 'accepted',
            },
            {
                project: projects[3]._id,
                freelancer: freelancers[1]._id,
                amount: 1400,
                deliveryDays: 40,
                proposal: 'I have experience writing content for fashion and lifestyle brands. I can create engaging, SEO-friendly content that drives organic traffic. I will handle keyword research, writing, and basic on-page optimization.',
                status: 'rejected',
            },

            // Bids on Project 4: Social Media Campaign (open)
            {
                project: projects[4]._id,
                freelancer: freelancers[4]._id,
                amount: 1800,
                deliveryDays: 20,
                proposal: 'I have managed social media campaigns for product launches before and know what works. I will create a comprehensive strategy covering content pillars, posting schedule, engagement tactics, and influencer partnerships. Each post will be designed to drive engagement and build anticipation for your launch.',
                status: 'pending',
            },

            // Bids on Project 5: Fintech Dashboard (open)
            {
                project: projects[5]._id,
                freelancer: freelancers[0]._id,
                amount: 7500,
                deliveryDays: 40,
                proposal: 'I have built real-time dashboards with WebSocket data streaming before. For the charts, I recommend Recharts for standard visualizations and D3.js for the candlestick charts. I will ensure the dashboard handles large datasets efficiently with virtualization and smart data fetching strategies.',
                status: 'pending',
            },
            {
                project: projects[5]._id,
                freelancer: freelancers[1]._id,
                amount: 8000,
                deliveryDays: 35,
                proposal: 'Financial dashboards require both technical excellence and beautiful design. I can build a dashboard that is visually stunning, real-time, and handles complex data visualizations. I have experience with D3.js for custom financial charts and React for the component architecture.',
                status: 'pending',
            },
            {
                project: projects[5]._id,
                freelancer: freelancers[3]._id,
                amount: 9000,
                deliveryDays: 45,
                proposal: 'My backend expertise combined with financial services experience makes me a strong fit. I will set up the WebSocket infrastructure for reliable real-time streaming, build performant APIs for historical data, and create a robust React frontend with D3.js visualizations.',
                status: 'pending',
            },

            // Bids on Project 6: CI/CD Pipeline (completed, James accepted)
            {
                project: projects[6]._id,
                freelancer: freelancers[3]._id,
                amount: 5500,
                deliveryDays: 21,
                proposal: 'This is my core expertise. I have set up AWS infrastructure and CI/CD pipelines for multiple fintech companies, including ones with compliance requirements. I will use Terraform for all infrastructure, GitHub Actions for CI/CD, and set up proper monitoring with CloudWatch and alerting.',
                status: 'accepted',
            },
            {
                project: projects[6]._id,
                freelancer: freelancers[0]._id,
                amount: 4800,
                deliveryDays: 25,
                proposal: 'I have experience with AWS and Docker-based deployments. I can set up the infrastructure and CI/CD pipeline as described. I am familiar with security best practices for web applications.',
                status: 'rejected',
            },

            // Bids on Project 7: Data Analytics Dashboard (open)
            {
                project: projects[7]._id,
                freelancer: freelancers[3]._id,
                amount: 6500,
                deliveryDays: 35,
                proposal: 'I have built data pipelines and analytics dashboards with Python and PostgreSQL. I can handle the backend with Flask or Django, optimize the database queries for large datasets, and build the React frontend. Report generation in PDF/CSV is something I have implemented before.',
                status: 'pending',
            },
            {
                project: projects[7]._id,
                freelancer: freelancers[0]._id,
                amount: 5800,
                deliveryDays: 40,
                proposal: 'I have experience with both Python backend development and React frontends. I can build the data connection layer, create interactive visualizations with Recharts, and implement the role-based access control. I will use Pandas for data processing and caching for performance.',
                status: 'pending',
            },
        ]);

        console.log('Created ' + bids.length + ' bids.');

        // Create Notifications
        await Notification.insertMany([
            {
                user: clients[0]._id,
                type: 'new_bid',
                title: 'New Bid Received',
                message: 'Priya Sharma placed a $4,500 bid on "Build a SaaS Customer Portal with React & Node.js"',
                relatedProject: projects[0]._id,
                read: true,
            },
            {
                user: clients[0]._id,
                type: 'new_bid',
                title: 'New Bid Received',
                message: 'Daniel Kim placed a $5,200 bid on "Build a SaaS Customer Portal with React & Node.js"',
                relatedProject: projects[0]._id,
                read: false,
            },
            {
                user: freelancers[2]._id,
                type: 'bid_accepted',
                title: 'Bid Accepted!',
                message: 'Your bid on "Mobile App for Internal Team Communication" has been accepted!',
                relatedProject: projects[1]._id,
                read: true,
            },
            {
                user: freelancers[4]._id,
                type: 'bid_accepted',
                title: 'Bid Accepted!',
                message: 'Your bid on "Write SEO-Optimized Blog Content for E-commerce Brand" has been accepted!',
                relatedProject: projects[3]._id,
                read: false,
            },
            {
                user: freelancers[3]._id,
                type: 'bid_accepted',
                title: 'Bid Accepted!',
                message: 'Your bid on "Set Up CI/CD Pipeline and Cloud Infrastructure" has been accepted!',
                relatedProject: projects[6]._id,
                read: true,
            },
            {
                user: clients[2]._id,
                type: 'new_bid',
                title: 'New Bid Received',
                message: 'James Wilson placed a $6,500 bid on "Data Analytics Dashboard for Business Intelligence"',
                relatedProject: projects[7]._id,
                read: false,
            },
        ]);

        console.log('Created notifications.');
        console.log('\n--- Database seeded successfully! ---\n');
        console.log('Demo Accounts (password: password123)');
        console.log('');
        console.log('CLIENTS:');
        console.log('  arjun@example.com   (2 projects, 1 in-progress)');
        console.log('  sarah@example.com   (3 projects, 1 in-progress)');
        console.log('  ravi@example.com    (3 projects, 1 completed)');
        console.log('');
        console.log('FREELANCERS:');
        console.log('  priya@example.com   (Full-stack developer)');
        console.log('  daniel@example.com  (UI/UX designer)');
        console.log('  ananya@example.com  (Mobile developer - 1 accepted bid)');
        console.log('  james@example.com   (Backend/DevOps - 1 accepted bid)');
        console.log('  neha@example.com    (Content writer - 1 accepted bid)');
        console.log('');

        process.exit(0);
    } catch (error) {
        console.error('Seeding error:', error);
        process.exit(1);
    }
};

seedDB();
