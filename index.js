const express = require('express');
const fileUpload = require('express-fileupload');
const pdfParse = require('pdf-parse');
const { Configuration, OpenAIApi } = require('openai');
const sqlite = require('sqlite');
const sqlite3 = require('sqlite3');

require('dotenv').config();

const app = express();
const port = 8080;

app.use(express.static('public'));
app.use(express.static('node_modules'))
app.use(express.json());
app.use(fileUpload());

// const dbPromise = sqlite.open({
//   filename: './database/todolist.sqlite',
//   driver: sqlite3.Database
// })

const configuration = new Configuration({
  apiKey: process.env.OPEN_AI_KEY,
});

const openai = new OpenAIApi(configuration);

app.post('/extract-text', (req, res) => {
  if (!req.files || !req.files.pdfFile) {
    return res.status(400).send('No PDF file uploaded.');
  }

  pdfParse(req.files.pdfFile.data)
    .then(result => {
      const extractedText = result.text;
      res.json({ text: extractedText });
    })
    .catch(error => {
      console.error('PDF Parse Error:', error);
      res.status(500).send('Failed to parse the PDF file.');
    });
});

let schema = `{
  "firstName": "Harsh",
  "lastName": "Kumar",
  "email": "hkumar30@asu.edu",
  "phone": "332-209-9652",
  "address": "Tempe, AZ",
  "experience": [
    {
      "title": "Tutorbot Content Creator",
      "company": "Academic Support Network",
      "location": "Tempe, AZ",
      "dates": "Jan 2024 – Present",
      "responsibilities": [
        "Content and research development for Arizona State's AI Bot, Tutorbot",
        "Creation of Standard Operating Procedures for academic content"
      ]
    },
    {
      "title": "Subject Area Tutor",
      "company": "Academic Support Network",
      "location": "Tempe, AZ",
      "dates": "Aug 2022 – Dec 2023",
      "responsibilities": [
        "Tutoring students in various subjects like Data Structures, Algorithms, Calculus, Chemistry"
      ]
    }
  ],
  "education": {
    "university": "Arizona State University",
    "graduationDate": "May 2025",
    "degree": "Bachelor of Science in Computer Science",
    "location": "Tempe, AZ",
    "gpa": "4.00/4.00",
    "relevantCoursework": [
      "Data Structures and Algorithms (C++)",
      "Operating Systems",
      "Distributed Software Development (C#)",
      "Web Information Management System",
      "Computational Theory"
    ]
  },
  "skills": {
    "languages": [
      "C/C++",
      "C#",
      "JavaScript",
      "Java",
      "Python",
      "HTML/CSS",
      "XML",
      "Kotlin",
      "Scheme",
      "Prolog",
      "SQLite",
      "Git"
    ],
    "frameworks": [
      "React.js",
      "Express.js",
      "Bootstrap",
      "Flask",
      "ASP.NET",
      "Node.js",
      "Android SDK"
    ],
    "developerTools": [
      "AWS",
      "Figma",
      "Git",
      "Docker",
      "Android Studio",
      "VS Code",
      "Visual Studio",
      "PyCharm",
      "IntelliJ",
      "Eclipse",
      "LaTeX"
    ],
    "libraries": [
      "gsap",
      "pandas",
      "pillow",
      "Redux",
      "NumPy",
      "Matplotlib",
      "SimpleImage"
    ]
  },
  "biography": "Harsh Kumar is a dedicated Computer Science student at Arizona State University with a strong background in tutoring and artificial intelligence. He has a keen interest in software development and has actively contributed to various projects using a wide array of programming languages and frameworks."
}`;


app.post('/parse-text', async (req, res) => {
  const { text } = req.body; // Make sure to send the extracted text in the body of the POST request

  if (!text) {
    return res.status(400).send('No text provided for parsing.');
  }
  try {
    const response = await openai.createChatCompletion({
      model: 'gpt-3.5-turbo',
      messages: [
        {
          role: "system",
          content: `Extract the first name, last name, email, phone number, address, experience, education, skills and a 50-word biographical summary from the resume, provide output in valid JSON, in the following format:
          
          {
            "firstName": "",
            "lastName": "",
            "email": "",
            "phone": "",
            "address": "",
            "experience": [
                {
                    "title": "",
                    "company": "",
                    "location": "",
                    "dates": ""
                },
                {
                    "title": "",
                    "company": "",
                    "location": "",
                    "dates": ""
                }
            ],
            "education": {
                "university": "",
                "graduationDate": "",
                "degree": "",
                "location": ""
            },
            "skills": {},
            "biography": ""
          }`,
        
        },
        {
          role: "user",
          content: text
        },
      ]
    });
    
    res.json({
      success: true,
      data: JSON.stringify(response.data.choices[0].message.content),
    });
  } catch (error) {
    console.error('OpenAI API Error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to parse the text with OpenAI.',
      details: error.response?.data || error.message,
    });
  }
});

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});