// index.js
const express = require('express');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const cors = require('cors');
const app = express();
const axios = require('axios');
// const students=require('./array.js')

app.use(cors());

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

const CHUNK_SIZE = 1000; // Number of records per chunk
const MAX_RECORDS = 2000;




app.get('/students', async (req, res) => {
  try {
    let offset = 0;
    let allStudents = [];

    while (allStudents.length < MAX_RECORDS) {
      // Fetch the next chunk of records
      const students = await prisma.student.findMany({
        select: {
          id: true,
          name: true,
          age: true,
          email: true,
          phoneNumber: true,
          address: true,
          dateOfBirth: true,
          enrollmentDate: true,
          course: true,
          grade: true,
          isActive: true,
          guardianName: true,
          guardianPhone: true,
          gender: true,
          nationality: true,
          profileImageUrl: true,
          createdAt: true,
        },
        take: CHUNK_SIZE,
        skip: offset, // Skip already fetched records
      });

      if (students.length === 0) {
        // Exit loop if no more records are found
        break;
      }

      allStudents = allStudents.concat(students);
      offset += CHUNK_SIZE; // Move to the next chunk
    }

    // Limit the total number of records to MAX_RECORDS
    allStudents = allStudents.slice(0, MAX_RECORDS);

    // Send the data to the external API that returns an Excel file
    const response = await axios.post("https://server-2-two.vercel.app/download-xlsx", allStudents, {
      responseType: 'arraybuffer', // Important to handle binary data like Excel files
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Set the correct headers for Excel file download
    res.setHeader('Content-Disposition', 'attachment; filename=students.xlsx');
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    
    // Send the file to the client
    res.status(200).send(response.data);
  } catch (error) {
    console.error('Error fetching students or sending data to external API:', error);
    res.status(500).json({ error: 'Something went wrong while fetching students or generating Excel file.' });
  }
})

// Start the server
app.listen(8000, () => {
  console.log('Server is running on http://localhost:8000');
});
