export const MAJORS_LIST = [
  { category: "Medicine & Health Sciences", majors: [
    "Medicine & Surgery", "Nursing Science", "Pharmacy", "Medical Laboratory Science", 
    "Physiotherapy", "Dentistry", "Optometry", "Radiography", "Public Health", 
    "Community Health", "Anatomy", "Physiology", "Biochemistry (Medical)", 
    "Health Information Management"
  ]},
  { category: "Engineering", majors: [
    "Petroleum Engineering", "Electrical/Electronic Engineering", "Mechanical Engineering", 
    "Civil Engineering", "Chemical Engineering", "Computer Engineering", 
    "Agricultural Engineering", "Food Science & Technology", "Metallurgical & Materials Engineering", 
    "Marine Engineering", "Production Engineering", "Systems Engineering", 
    "Biomedical Engineering", "Structural Engineering"
  ]},
  { category: "Computing & Technology", majors: [
    "Computer Science", "Software Engineering", "Information Technology", 
    "Cybersecurity", "Data Science", "Information Systems", "Library & Information Science"
  ]},
  { category: "Business, Finance & Management", majors: [
    "Accounting", "Business Administration", "Banking & Finance", "Economics", 
    "Marketing", "Human Resource Management", "International Business", 
    "Entrepreneurship", "Insurance & Actuarial Science", "Project Management", "Taxation"
  ]},
  { category: "Law & Social Sciences", majors: [
    "Law (LL.B)", "Political Science", "Sociology", "Psychology", 
    "International Relations", "Mass Communication", "Criminology & Security Studies", 
    "Philosophy", "Religious Studies"
  ]},
  { category: "Natural & Applied Sciences", majors: [
    "Biochemistry", "Microbiology", "Chemistry", "Physics", "Mathematics", 
    "Statistics", "Geology", "Industrial Chemistry", "Plant Science & Biotechnology", 
    "Zoology", "Environmental Science"
  ]},
  { category: "Agriculture & Environmental Studies", majors: [
    "Agricultural Science", "Animal Science", "Crop Science", "Soil Science", 
    "Forestry & Wildlife", "Fisheries & Aquaculture", "Estate Management", 
    "Urban & Regional Planning", "Quantity Surveying", "Building Technology", 
    "Architecture", "Landscape Architecture", "Surveying & Geoinformatics"
  ]},
  { category: "Education", majors: [
    "Education (various specializations)", "Guidance & Counselling", 
    "Educational Administration", "Special Education", "Adult Education"
  ]},
  { category: "Arts & Humanities", majors: [
    "English Language", "English Literature", "History & International Studies", 
    "Linguistics", "Theatre Arts", "Music", "Fine & Applied Arts", "French", 
    "Igbo/Yoruba/Hausa Studies"
  ]},
  { category: "Other Professional Courses", majors: [
    "Hospitality & Tourism Management", "Transport Management", "Library Science", 
    "Secretarial Administration", "Social Work", "Development Studies"
  ]}
];

export const ALL_MAJORS = MAJORS_LIST.flatMap(c => c.majors).sort();
