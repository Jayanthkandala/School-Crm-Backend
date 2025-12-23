const express = require('express');
const router = express.Router();
const subjectsController = require('./subjects.controller');
const { requireSchoolAdmin } = require('../../middleware/permission.middleware');

router.post('/', requireSchoolAdmin, subjectsController.createSubject);
router.get('/', subjectsController.getAllSubjects);
router.get('/:id', subjectsController.getSubjectById);
router.put('/:id', requireSchoolAdmin, subjectsController.updateSubject);
router.delete('/:id', requireSchoolAdmin, subjectsController.deleteSubject);
router.post('/:id/assign', requireSchoolAdmin, subjectsController.assignTeacher);

module.exports = router;
