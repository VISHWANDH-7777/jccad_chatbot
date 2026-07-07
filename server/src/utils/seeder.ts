import mongoose from 'mongoose';
import { CompanyProfile } from '../models/CompanyProfile';
import { KnowledgeItem } from '../models/KnowledgeItem';
import { VectorRecord } from '../models/VectorRecord';
import { generateMockEmbedding } from '../controllers/vector';
import { planChunks } from '../controllers/pipeline';
import { CompanyProfileData } from '../../../shared/types/profile';
import { KnowledgeCategory } from '../../../shared/types/knowledge';

// Official primary source of truth JCCAD Company Profile Data
export const OFFICIAL_PROFILE_DATA: CompanyProfileData = {
  companyName: "JCCAD Software Solutions",
  tagline: "Engineering, Technology & Skill Development Hub",
  aboutUs: "JCCAD Software Solutions is an engineering and technology company specializing in CAD training, CAD design services, website development, engineering solutions, research & development, and skill development programs. The company delivers industry-focused solutions for: Students, Professionals, Startups, Educational Institutions, and Industries.",
  mission: "To bridge the gap between academia and industry through practical training, advanced engineering services, and technology-driven innovation.",
  vision: "To become a trusted global engineering and technology company delivering innovative and industry-oriented solutions.",
  coreValues: [
    "Practical training",
    "Advanced engineering services",
    "Technology-driven innovation",
    "Academia-industry bridge"
  ],
  organizationType: "Engineering & Technology Hub",
  targetAudience: [
    "Students",
    "Professionals",
    "Startups",
    "Educational Institutions",
    "Industries"
  ],
  domains: [
    "Mechanical",
    "Automotive",
    "Manufacturing",
    "Design Solutions",
    "Skill Development"
  ],
  services: [
    "CAD Training",
    "CAD Design Services",
    "Engineering Design & Product Development",
    "Website Design & Development",
    "Technology Solutions",
    "Research & Development (R&D)",
    "Engineering Consultancy",
    "Internship Programs",
    "Corporate Training"
  ],
  softwareExpertise: [
    "AutoCAD",
    "CATIA",
    "SolidWorks",
    "Siemens NX",
    "PTC Creo",
    "Fusion 360",
    "ANSYS"
  ],
  industriesServed: [
    "Automotive",
    "Mechanical",
    "Manufacturing",
    "Educational Institutions",
    "Startups",
    "MSMEs",
    "Design Solutions (Drafting to Design)"
  ],
  contactEmail: "jccadsoftsol@gmail.com",
  contactPhone: "+91-XXXXXXXXXX",
  address: "India",
  websiteUrl: "https://jccad.in",
  workingHours: "9:00 AM - 6:00 PM",
  socialLinks: {
    linkedin: "https://linkedin.com/company/jccad",
    facebook: "",
    twitter: ""
  },
  leadership: [],
  stats: {
    studentCount: 5000,
    workshopCount: 120,
    uavProjectsCount: 15,
    industryPartnersCount: 45
  },
  faqs: [
    {
      id: "faq_1",
      question: "What is JCCAD?",
      answer: "JCCAD Software Solutions is an engineering and technology company specializing in CAD training, CAD design services, website development, engineering solutions, research & development, and skill development programs.",
      category: "General"
    },
    {
      id: "faq_2",
      question: "What services does JCCAD provide?",
      answer: "JCCAD provides services including CAD Training, CAD Design Services, Engineering Design & Product Development, Website Design & Development, Technology Solutions, Research & Development (R&D), Engineering Consultancy, Internship Programs, and Corporate Training.",
      category: "Services"
    },
    {
      id: "faq_3",
      question: "What software does JCCAD teach?",
      answer: "JCCAD teaches industry-standard CAD software including AutoCAD, CATIA, SolidWorks, Siemens NX, PTC Creo, Fusion 360, and ANSYS.",
      category: "Courses"
    },
    {
      id: "faq_4",
      question: "Do you offer internships?",
      answer: "Yes, JCCAD Software Solutions offers structured internship programs in engineering design, website development, and skill development.",
      category: "Internships"
    },
    {
      id: "faq_5",
      question: "Who are your target customers?",
      answer: "JCCAD serves Students, Professionals, Startups, Educational Institutions, and Industries.",
      category: "General"
    },
    {
      id: "faq_6",
      question: "What industries do you serve?",
      answer: "JCCAD serves various industries including Automotive, Mechanical, Manufacturing, Educational Institutions, Startups, MSMEs, and Design Solutions (Drafting to Design).",
      category: "General"
    },
    {
      id: "faq_7",
      question: "How can I contact JCCAD?",
      answer: "You can contact JCCAD Software Solutions via email at jccadsoftsol@gmail.com or visit the official website at https://jccad.in.",
      category: "Support"
    }
  ]
};

// Interface for structure definition
interface SeedKnowledgeItem {
  title: string;
  category: KnowledgeCategory;
  topic: string;
  tags: string[];
  keywords: string[];
  sections: Array<{
    heading: string;
    content: string;
    contentType: 'paragraph' | 'list' | 'table' | 'definition';
  }>;
}

// Convert JCCAD Company Profile into structured knowledge assets
export const OFFICIAL_KNOWLEDGE_BASE: SeedKnowledgeItem[] = [
  {
    title: "About JCCAD Software Solutions",
    category: "Company Profile",
    topic: "Company Overview",
    tags: ["jccad", "about", "mission", "vision", "overview"],
    keywords: ["jccad", "company profile", "about jccad", "engineering hub", "technology hub"],
    sections: [
      {
        heading: "Company Overview",
        content: "JCCAD Software Solutions is an engineering and technology company specializing in CAD training, CAD design services, website development, engineering solutions, research & development, and skill development programs. The company delivers industry-focused solutions for: Students, Professionals, Startups, Educational Institutions, and Industries.",
        contentType: "paragraph"
      },
      {
        heading: "Mission Statement",
        content: "To bridge the gap between academia and industry through practical training, advanced engineering services, and technology-driven innovation.",
        contentType: "paragraph"
      },
      {
        heading: "Vision Statement",
        content: "To become a trusted global engineering and technology company delivering innovative and industry-oriented solutions.",
        contentType: "paragraph"
      },
      {
        heading: "Tagline",
        content: "Engineering, Technology & Skill Development Hub",
        contentType: "paragraph"
      }
    ]
  },
  {
    title: "JCCAD Services & Offerings",
    category: "Services",
    topic: "Company Services",
    tags: ["services", "offerings", "cad training", "web development", "internships"],
    keywords: ["cad design", "product development", "consultancy", "internships", "training"],
    sections: [
      {
        heading: "Core Services",
        content: "JCCAD Software Solutions provides multiple industry-focused services including CAD Training, CAD Design Services, Engineering Design & Product Development, Website Design & Development, Technology Solutions, Research & Development (R&D), Engineering Consultancy, Internship Programs, and Corporate Training.",
        contentType: "list"
      },
      {
        heading: "CAD Training & Skill Development",
        content: "JCCAD provides specialized practical training in leading engineering computer-aided design (CAD) software suites. Programs are designed to bridge the gap between academic knowledge and industry demands, preparing students and professionals for real-world mechanical and automotive design roles.",
        contentType: "paragraph"
      },
      {
        heading: "Website Design & Development",
        content: "JCCAD specializes in building modern, interactive, and responsive web platforms. The team offers comprehensive web solutions including custom frontend designs, backend architectures, UI/UX optimization, and deployment.",
        contentType: "paragraph"
      },
      {
        heading: "Engineering Consultancy & Design Services",
        content: "JCCAD offers product development, CAD drafting, modeling, finite element analysis (FEA), and engineering design services for startups, MSMEs, and heavy machinery industries.",
        contentType: "paragraph"
      },
      {
        heading: "Internship Programs & Corporate Training",
        content: "JCCAD offers structured training programs and industrial internships. These programs allow students to work on practical engineering challenges, gain hands-on expertise, and earn certificates.",
        contentType: "paragraph"
      }
    ]
  },
  {
    title: "JCCAD Software Expertise",
    category: "Courses",
    topic: "Engineering Training",
    tags: ["software", "cad", "autocad", "solidworks", "catia", "ansys"],
    keywords: ["siemens nx", "creo", "fusion 360", "cad course", "cad training"],
    sections: [
      {
        heading: "Supported Software Suites",
        content: "JCCAD Software Solutions provides training and engineering services using industry-standard engineering design and simulation software. The primary software expertise covers:\n- AutoCAD (Computer-Aided Drafting)\n- CATIA (Advanced Design and Aerospace/Automotive Modeling)\n- SolidWorks (Parametric 3D Solid Modeling)\n- Siemens NX (High-end CAD/CAM/CAE Suite)\n- PTC Creo (3D CAD Parametric Software)\n- Fusion 360 (Cloud-based 3D CAD/CAM/CAE Platform)\n- ANSYS (Finite Element Analysis and Engineering Simulation)",
        contentType: "list"
      }
    ]
  },
  {
    title: "JCCAD Industries Served",
    category: "Engineering Domains",
    topic: "Industry Verticals",
    tags: ["industries", "automotive", "mechanical", "manufacturing", "msme"],
    keywords: ["sectors", "drafting", "startups", "educational institutions"],
    sections: [
      {
        heading: "Sectors & Target Verticals",
        content: "JCCAD Software Solutions serves multiple industries and customer segments. The primary target domains include:\n- Automotive Design & Manufacturing\n- Mechanical Design\n- Manufacturing Sectors\n- Educational Institutions (Academia-industry tie-ups)\n- Startups (Product prototyping and modeling)\n- Micro, Small and Medium Enterprises (MSMEs)\n- General Design Solutions (Drafting to CAD model transformation)",
        contentType: "list"
      }
    ]
  },
  {
    title: "JCCAD Contact Information",
    category: "Support",
    topic: "Customer Channels",
    tags: ["contact", "email", "website", "support"],
    keywords: ["jccad contact", "how to contact", "jccad email", "jccad website"],
    sections: [
      {
        heading: "Official Contact Channels",
        content: "You can reach out to JCCAD Software Solutions through the following official channels:\n- Official Website: https://jccad.in\n- Official Email: jccadsoftsol@gmail.com",
        contentType: "definition"
      }
    ]
  }
];

// Seeding engine function
export const seedJccadDatabase = async () => {
  console.log('[SEEDER] Starting database check and seeding for JCCAD official company profile...');

  try {
    const systemUserId = new mongoose.Types.ObjectId();

    // 1. Seed Company Profile
    let profile = await CompanyProfile.findOne({ status: 'Published' });
    if (!profile) {
      profile = await CompanyProfile.findOne().sort({ updatedAt: -1 });
    }

    if (profile) {
      console.log(`[SEEDER] Existing company profile found (v${profile.version}). Updating with official profile values...`);
      profile.data = OFFICIAL_PROFILE_DATA;
      profile.status = 'Published';
      profile.reviewHistory.push({
        status: 'Published',
        actorId: (profile.publishedBy || systemUserId).toString() as any,
        actorName: 'System Seeder',
        notes: 'System auto-updated profile content to match official version.',
        timestamp: new Date().toISOString()
      });
      await profile.save();
      console.log(`[SEEDER] Company Profile updated successfully.`);
    } else {
      console.log('[SEEDER] No existing company profile found. Creating a new Published profile record...');
      profile = new CompanyProfile({
        version: 1,
        status: 'Published',
        data: OFFICIAL_PROFILE_DATA,
        publishedBy: systemUserId,
        reviewHistory: [
          {
            status: 'Published',
            actorId: systemUserId.toString() as any,
            actorName: 'System Seeder',
            notes: 'Initial seeding of official JCCAD company profile.',
            timestamp: new Date().toISOString()
          }
        ]
      });
      await profile.save();
      console.log('[SEEDER] Official Company Profile created and published successfully.');
    }

    // 2. Seed Structured Knowledge Items and Vectors
    const savedKnowledgeItems: mongoose.Document[] = [];
    
    for (const kItem of OFFICIAL_KNOWLEDGE_BASE) {
      let existingItem = await KnowledgeItem.findOne({ title: kItem.title, status: 'Published' });
      if (!existingItem) {
        existingItem = await KnowledgeItem.findOne({ title: kItem.title }).sort({ updatedAt: -1 });
      }

      if (existingItem) {
        console.log(`[SEEDER] Existing KnowledgeItem "${kItem.title}" found. Updating content...`);
        existingItem.category = kItem.category;
        existingItem.sections = kItem.sections.map(s => ({
          heading: s.heading,
          content: s.content,
          contentType: s.contentType
        }));
        existingItem.metadata = {
          topic: kItem.topic,
          tags: kItem.tags,
          keywords: kItem.keywords,
          qualityScore: 100,
          language: 'en'
        };
        existingItem.status = 'Published';
        await existingItem.save();
        savedKnowledgeItems.push(existingItem);
        console.log(`[SEEDER] KnowledgeItem "${kItem.title}" updated.`);
      } else {
        console.log(`[SEEDER] Creating new KnowledgeItem "${kItem.title}"...`);
        const item = new KnowledgeItem({
          title: kItem.title,
          category: kItem.category,
          sections: kItem.sections.map(s => ({
            heading: s.heading,
            content: s.content,
            contentType: s.contentType
          })),
          relationships: [],
          source: {
            sourceType: 'Profile',
            sourceId: profile._id.toString(),
            sourceVersion: profile.version
          },
          metadata: {
            topic: kItem.topic,
            tags: kItem.tags,
            keywords: kItem.keywords,
            qualityScore: 100,
            language: 'en'
          },
          status: 'Published',
          version: 1,
          createdById: systemUserId,
          createdByName: 'System Seeder'
        });
        await item.save();
        savedKnowledgeItems.push(item);
        console.log(`[SEEDER] KnowledgeItem "${kItem.title}" created successfully.`);
      }
    }

    // 3. Establish Relationships between seeded items
    console.log('[SEEDER] Linking knowledge graph relationships...');
    const aboutItem = savedKnowledgeItems.find((i: any) => i.title === "About JCCAD Software Solutions") as any;
    const servicesItem = savedKnowledgeItems.find((i: any) => i.title === "JCCAD Services & Offerings") as any;
    const softwareItem = savedKnowledgeItems.find((i: any) => i.title === "JCCAD Software Expertise") as any;
    const industriesItem = savedKnowledgeItems.find((i: any) => i.title === "JCCAD Industries Served") as any;
    const contactItem = savedKnowledgeItems.find((i: any) => i.title === "JCCAD Contact Information") as any;

    if (aboutItem) {
      if (servicesItem) {
        servicesItem.relationships = [{ type: 'relates_to', targetItemId: aboutItem._id, targetItemTitle: aboutItem.title }];
        await servicesItem.save();
      }
      if (softwareItem && servicesItem) {
        softwareItem.relationships = [{ type: 'belongs_to', targetItemId: servicesItem._id, targetItemTitle: servicesItem.title }];
        await softwareItem.save();
      }
      if (industriesItem) {
        industriesItem.relationships = [{ type: 'relates_to', targetItemId: aboutItem._id, targetItemTitle: aboutItem.title }];
        await industriesItem.save();
      }
      if (contactItem) {
        contactItem.relationships = [{ type: 'relates_to', targetItemId: aboutItem._id, targetItemTitle: aboutItem.title }];
        await contactItem.save();
      }
      console.log('[SEEDER] Relationships indexed successfully.');
    }

    // 4. Populate deterministic VectorRecords for retrieval
    console.log('[SEEDER] Seeding vector embedding chunks for retrieval...');
    for (const item of savedKnowledgeItems as any[]) {
      // Clear previous vectors for this knowledge item
      await VectorRecord.deleteMany({ knowledgeId: item._id });

      const canonicalText = item.sections
        .map((sec: any) => `# ${sec.heading}\n\n${sec.content}`)
        .join('\n\n');

      const rawChunks = planChunks(canonicalText);
      const records = rawChunks.map((content, idx) => {
        const embedding = generateMockEmbedding(content);
        return {
          knowledgeId: item._id,
          chunkIndex: idx,
          content,
          embedding,
          metadata: {
            category: item.category,
            department: 'Engineering',
            topic: item.metadata.topic,
            tags: item.metadata.tags,
            visibility: 'Internal',
            version: item.version,
            embeddingModel: 'text-embedding-3-small'
          }
        };
      });

      if (records.length > 0) {
        await VectorRecord.insertMany(records);
        console.log(`[SEEDER] Seeded ${records.length} vector chunks for "${item.title}".`);
      }
    }

    console.log('[SEEDER] Seeding process successfully completed.');
  } catch (err: any) {
    console.error('[SEEDER] Error seeding JCCAD official data:', err.message || err);
  }
};
