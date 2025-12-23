const express = require('express');
const router = express.Router();
const sportsController = require('./sports.controller');
const { requireSchoolRole } = require('../../middleware/permission.middleware');

// Routes mounted in school.routes.js are already authenticated.

/**
 * @swagger
 * tags:
 *   name: School - Sports
 *   description: Sports, Teams and Players
 */

/**
 * @swagger
 * /school/sports:
 *   get:
 *     summary: Get all sports
 *     tags: [School - Sports]
 *     responses:
 *       200:
 *         description: List of sports
 *   post:
 *     summary: Add a sport
 *     tags: [School - Sports]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [sportName]
 *             properties:
 *               sportName:
 *                 type: string
 *               coachName:
 *                 type: string
 *     responses:
 *       200:
 *         description: Sport created
 */
router.get('/', requireSchoolRole('SCHOOL_ADMIN', 'PRINCIPAL', 'TEACHER', 'PARENT', 'STUDENT'), sportsController.getAllSports);
router.post('/', requireSchoolRole('SCHOOL_ADMIN', 'PRINCIPAL', 'TEACHER'), sportsController.addSport);

/**
 * @swagger
 * /school/sports/teams:
 *   post:
 *     summary: Create a sports team
 *     tags: [School - Sports]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [sportId, teamName]
 *             properties:
 *               sportId:
 *                 type: string
 *               teamName:
 *                 type: string
 *     responses:
 *       200:
 *         description: Team created
 */
router.post('/teams', requireSchoolRole('SCHOOL_ADMIN', 'PRINCIPAL', 'TEACHER'), sportsController.createTeam);

/**
 * @swagger
 * /school/sports/players:
 *   post:
 *     summary: Add a player to a team
 *     tags: [School - Sports]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [teamId, studentId]
 *             properties:
 *               teamId:
 *                 type: string
 *               studentId:
 *                 type: string
 *     responses:
 *       200:
 *         description: Player added
 */
router.post('/players', requireSchoolRole('SCHOOL_ADMIN', 'PRINCIPAL', 'TEACHER'), sportsController.addPlayerToTeam);

module.exports = router;
