/**
 * Class Model
 * Purpose: Schema for college classes
 * Version: 1.0.0
 * Last Modified: July 31, 2025
 */

const mongoose = require('mongoose');

// Class schema
const classSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Class name is required'],
    trim: true,
    unique: true
  },
  department: {
    type: String,
    required: [true, 'Department is required'],
    trim: true
  },
  year: {
    type: Number,
    required: [true, 'Year is required']
  },
  section: {
    type: String,
    required: [true, 'Section is required'],
    trim: true
  },
  classTeacher: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  students: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  active: {
    type: Boolean,
    default: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Virtual for getting number of students
classSchema.virtual('studentCount').get(function() {
  return this.students.length;
});

// Method to get full class name (Department-Year-Section)
classSchema.methods.getFullName = function() {
  return `${this.department}-${this.year}-${this.section}`;
};

// Create the model
const Class = mongoose.model('Class', classSchema);

module.exports = Class;
