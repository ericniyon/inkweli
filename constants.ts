
import { SubscriptionTier, Article } from './types';

export const SUBSCRIPTION_PLANS = [
  {
    id: 'plan_unlimited',
    tier: SubscriptionTier.UNLIMITED,
    name: 'Unlimited Access',
    price: 50000,
    interval: 'year',
    features: ['Unlimited articles', 'Full highlight/comment access', 'Priority support'],
    color: 'indigo'
  },
  {
    id: 'plan_two',
    tier: SubscriptionTier.TWO_ARTICLES,
    name: 'Standard Access',
    price: 30000,
    interval: 'month',
    features: ['2 Articles per month', 'Highlight/comment access'],
    color: 'slate'
  },
  {
    id: 'plan_one',
    tier: SubscriptionTier.ONE_ARTICLE,
    name: 'Lite Access',
    price: 20000,
    interval: 'month',
    features: ['1 Article per month', 'Highlight/comment access'],
    color: 'gray'
  }
];

export const WRITERS = [
  {
    id: 'auth_1',
    name: 'Jean Bosco',
    role: 'Senior Correspondent',
    bio: 'Specializing in technological evolution and policy across East Africa. Former analyst at Kigali Tech Hub.',
    image: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=256&h=256&auto=format&fit=crop',
    articlesCount: 42,
    socials: { twitter: '#', linkedin: '#' }
  },
  {
    id: 'auth_2',
    name: 'Marie Louise',
    role: 'Economics Editor',
    bio: 'An expert in macro-economic frameworks and regional trade agreements. Passionate about sustainable growth.',
    image: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?q=80&w=256&h=256&auto=format&fit=crop',
    articlesCount: 38,
    socials: { twitter: '#', linkedin: '#' }
  },
  {
    id: 'auth_3',
    name: 'David Karemera',
    role: 'Opinion Writer',
    bio: 'A provocative voice on social dynamics and urban development in Rwanda. Focuses on the human stories behind the data.',
    image: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?q=80&w=256&h=256&auto=format&fit=crop',
    articlesCount: 29,
    socials: { twitter: '#', linkedin: '#' }
  }
];

export const MOCK_ARTICLES: Article[] = [
  {
    id: '1',
    title: 'The Future of Digital Media in East Africa',
    slug: 'future-digital-media-east-africa',
    excerpt: 'Exploring the rapid transformation of the digital landscape in Rwanda and its neighbors.',
    content: `<p>Digital media is undergoing a profound transformation across East Africa. From the bustling streets of Kigali to the tech hubs in Nairobi, a new era of storytelling is emerging. The shift from traditional print to digital-first platforms is not just about convenience; it's about accessibility and real-time engagement.</p><p>As internet penetration increases, we are seeing a rise in niche publications that cater to specific interests, from fintech to modern agricultural practices. This democratization of information is empowering citizens and creating a more informed public discourse.</p><p>However, this transition also brings challenges. The fight against misinformation and the need for sustainable business models in a world dominated by social media giants remain at the forefront of the industry's concerns.</p>`,
    authorId: 'auth_1',
    authorName: 'Jean Bosco',
    publishDate: '2024-05-15',
    status: 'PUBLISHED',
    featuredImage: 'https://images.unsplash.com/photo-1495020689067-958852a7765e?q=80&w=1200&h=600&auto=format&fit=crop',
    readingTime: 6,
    category: 'Technology'
  },
  {
    id: '2',
    title: 'Navigating Rwandan Economic Policies for Startups',
    slug: 'rwandan-economic-policies-startups',
    excerpt: 'A comprehensive guide to leveraging government incentives for your new venture.',
    content: `<p>Rwanda has positioned itself as a "Proof of Concept" hub for the continent. With a focus on ease of doing business and significant investment in infrastructure, the nation is attracting entrepreneurs from across the globe.</p><p>Understanding the local economic policies is crucial for any startup. The government offers various incentives, including tax breaks for specific sectors and support through bodies like the Rwanda Development Board (RDB).</p><p>By aligning business goals with the national development agenda, startups can not only thrive but also contribute to the broader economic transformation of the country.</p>`,
    authorId: 'auth_2',
    authorName: 'Marie Louise',
    publishDate: '2024-05-10',
    status: 'PUBLISHED',
    featuredImage: 'https://images.unsplash.com/photo-1526304640581-d334cdbbf45e?q=80&w=1200&h=600&auto=format&fit=crop',
    readingTime: 8,
    category: 'Economy'
  },
  {
    id: '3',
    title: 'Diplomatic Shifts: Rwanda and the Regional Bloc',
    slug: 'diplomatic-shifts-rwanda',
    excerpt: 'Analyzing the latest developments in cross-border relations and trade agreements.',
    content: `<p>Strategic partnerships are being rewritten in the Great Lakes region. Recent diplomatic efforts have focused on enhancing regional integration and fostering economic cooperation.</p><p>The role of Rwanda in the East African Community (EAC) continues to evolve. From trade protocols to security cooperation, the decisions made in the halls of power have direct impacts on the lives of millions.</p><p>As the regional landscape shifts, understanding the underlying motivations and the potential for long-term stability is essential for policymakers and observers alike.</p>`,
    authorId: 'auth_3',
    authorName: 'David Karemera',
    publishDate: '2024-05-12',
    status: 'PUBLISHED',
    featuredImage: 'https://images.unsplash.com/photo-1529107386315-e1a2ed48a620?q=80&w=1200&h=600&auto=format&fit=crop',
    readingTime: 12,
    category: 'Politics'
  },
  {
    id: '4',
    title: 'The Renaissance of Rwandan Contemporary Art',
    slug: 'contemporary-art-rwanda',
    excerpt: 'How a new generation of painters is reclaiming the narrative of identity and history.',
    content: `<p>In the heart of Kigali, galleries are breathing new life into local traditions. A vibrant community of artists is emerging, using their canvases to explore themes of resilience, identity, and the future of the nation.</p><p>Contemporary art in Rwanda is no longer just about aesthetics; it's a powerful tool for storytelling and social commentary. From abstract paintings to intricate installations, the variety of work reflects a diverse and dynamic creative scene.</p><p>As these artists gain international recognition, they are helping to rewrite the global narrative of Rwandan culture, showcasing a nation that is forward-looking and deeply connected to its artistic roots.</p>`,
    authorId: 'auth_2',
    authorName: 'Marie Louise',
    publishDate: '2024-05-14',
    status: 'PUBLISHED',
    featuredImage: 'https://images.unsplash.com/photo-1541963463532-d68292c34b19?q=80&w=1200&h=600&auto=format&fit=crop',
    readingTime: 5,
    category: 'Culture'
  },
  {
    id: '5',
    title: 'Quantum Leap: Sub-Saharan Research Milestones',
    slug: 'quantum-leap-research',
    excerpt: 'Inside the labs pushing the boundaries of physics and materials science in Africa.',
    content: `<p>Science knows no borders, and recent breakthroughs in Sub-Saharan research are proving just that. From sustainable energy solutions to advanced material science, researchers are pushing the boundaries of what is possible.</p><p>Investment in STEM education and research infrastructure is starting to pay off. Collaborative projects between local universities and international partners are leading to innovations that address both regional and global challenges.</p><p>The future of science in the region looks bright, with a new generation of researchers ready to take on the most pressing issues of our time.</p>`,
    authorId: 'auth_1',
    authorName: 'Jean Bosco',
    publishDate: '2024-05-08',
    status: 'PUBLISHED',
    featuredImage: 'https://images.unsplash.com/photo-1532094349884-543bc11b234d?q=80&w=1200&h=600&auto=format&fit=crop',
    readingTime: 10,
    category: 'Science'
  },
  {
    id: '6',
    title: 'Why the Individual Matters More Than the Collective',
    slug: 'individual-matters-opinion',
    excerpt: 'A controversial take on the balance between state progress and personal liberty.',
    content: `<p>For too long, the rhetoric of development has obscured the necessity of the individual spirit. While collective progress is important, it should never come at the expense of personal liberty and individual agency.</p><p>The most successful societies are those that empower their citizens to think for themselves and pursue their own dreams. When we prioritize the collective over the individual, we risk stifling creativity and discouraging innovation.</p><p>It is time to re-evaluate our priorities and ensure that the rights and freedoms of the individual are at the center of our political and social discourse.</p>`,
    authorId: 'auth_3',
    authorName: 'David Karemera',
    publishDate: '2024-05-16',
    status: 'PUBLISHED',
    featuredImage: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?q=80&w=1200&h=600&auto=format&fit=crop',
    readingTime: 7,
    category: 'Opinion'
  },
  {
    id: '7',
    title: 'Smart Cities: Kigali’s Digital Infrastructure Roadmap',
    slug: 'kigali-digital-infrastructure',
    excerpt: 'Analyzing the urban planning and tech integration making Kigali a model for the continent.',
    content: `<p>Kigali is rapidly becoming a blueprint for smart city development in Africa...</p>`,
    authorId: 'auth_1',
    authorName: 'Jean Bosco',
    publishDate: '2024-05-18',
    status: 'PUBLISHED',
    featuredImage: 'https://images.unsplash.com/photo-1518770660439-4636190af475?q=80&w=1200&h=600&auto=format&fit=crop',
    readingTime: 9,
    category: 'Technology'
  },
  {
    id: '8',
    title: 'Financial Inclusion: The Rise of Mobile Money in Rural Rwanda',
    slug: 'mobile-money-rural-rwanda',
    excerpt: 'How digital wallets are transforming the economic lives of smallholder farmers.',
    content: `<p>The impact of mobile money on financial inclusion cannot be overstated...</p>`,
    authorId: 'auth_2',
    authorName: 'Marie Louise',
    publishDate: '2024-05-19',
    status: 'PUBLISHED',
    featuredImage: 'https://images.unsplash.com/photo-1563013544-824ae1b704d3?q=80&w=1200&h=600&auto=format&fit=crop',
    readingTime: 7,
    category: 'Economy'
  },
  {
    id: '9',
    title: 'Post-Genocide Literature: Voices of a New Generation',
    slug: 'post-genocide-literature-rwanda',
    excerpt: 'A review of the powerful new narratives emerging from Rwanda’s young writers.',
    content: `<p>Literature has always been a way for societies to process trauma and build hope...</p>`,
    authorId: 'auth_3',
    authorName: 'David Karemera',
    publishDate: '2024-05-20',
    status: 'PUBLISHED',
    featuredImage: 'https://images.unsplash.com/photo-1524995997946-a1c2e315a42f?q=80&w=1200&h=600&auto=format&fit=crop',
    readingTime: 11,
    category: 'Culture'
  },
  {
    id: '10',
    title: 'Blockchain for Land Registry: Transparency in Practice',
    slug: 'blockchain-land-registry-rwanda',
    excerpt: 'How decentralized ledgers are solving long-standing disputes in real estate.',
    content: `<p>Land ownership is a fundamental pillar of economic stability...</p>`,
    authorId: 'auth_1',
    authorName: 'Jean Bosco',
    publishDate: '2024-05-21',
    status: 'PUBLISHED',
    featuredImage: 'https://images.unsplash.com/photo-1639762681485-074b7f938ba0?q=80&w=1200&h=600&auto=format&fit=crop',
    readingTime: 8,
    category: 'Technology'
  },
  {
    id: '11',
    title: 'AI Ethics in East Africa: A Policy Framework',
    slug: 'ai-ethics-east-africa',
    excerpt: 'Developing a localized approach to artificial intelligence governance.',
    content: '<p>As AI tools become ubiquitous, the need for regional ethical standards grows...</p>',
    authorId: 'auth_1',
    authorName: 'Jean Bosco',
    publishDate: '2024-05-22',
    status: 'PUBLISHED',
    featuredImage: 'https://images.unsplash.com/photo-1677442136019-21780ecad995?q=80&w=1200&h=600&auto=format&fit=crop',
    readingTime: 7,
    category: 'Technology'
  },
  {
    id: '12',
    title: 'The Great Lakes Trade Corridor: 2025 Outlook',
    slug: 'great-lakes-trade-2025',
    excerpt: 'Projecting economic growth and logistical challenges in the coming year.',
    content: '<p>The infrastructure projects connecting the regional capitals are nearing completion...</p>',
    authorId: 'auth_2',
    authorName: 'Marie Louise',
    publishDate: '2024-05-23',
    status: 'PUBLISHED',
    featuredImage: 'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?q=80&w=1200&h=600&auto=format&fit=crop',
    readingTime: 11,
    category: 'Economy'
  },
  {
    id: '13',
    title: 'Renewable Energy: Rwanda’s Methane Extraction Success',
    slug: 'methane-extraction-rwanda',
    excerpt: 'How Lake Kivu is powering the nation through sustainable engineering.',
    content: '<p>The unique geological properties of Lake Kivu are being harnessed to drive the grid...</p>',
    authorId: 'auth_1',
    authorName: 'Jean Bosco',
    publishDate: '2024-05-24',
    status: 'PUBLISHED',
    featuredImage: 'https://images.unsplash.com/photo-1466611653911-95282fc3656b?q=80&w=1200&h=600&auto=format&fit=crop',
    readingTime: 9,
    category: 'Technology'
  },
  {
    id: '14',
    title: 'Tourism 2.0: High-End Eco-Conscious Travel',
    slug: 'tourism-2-0-rwanda',
    excerpt: 'The pivot towards low-impact, high-value experiential tourism.',
    content: '<p>Luxury and sustainability are merging to redefine Rwanda’s hospitality sector...</p>',
    authorId: 'auth_2',
    authorName: 'Marie Louise',
    publishDate: '2024-05-25',
    status: 'PUBLISHED',
    featuredImage: 'https://images.unsplash.com/photo-1544376798-89aa6b82c6cd?q=80&w=1200&h=600&auto=format&fit=crop',
    readingTime: 6,
    category: 'Economy'
  }
];
