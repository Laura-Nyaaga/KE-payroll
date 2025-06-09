const { Project, Company } = require("../models");
const softDelete = require("../utils/softDelete");

// CREATE PROJECT for a specific company
exports.createProject = async (req, res) => {
  try {
    const { companyId, ...projectData } = req.body;

    // Check if the company exists
    const company = await Company.findByPk(companyId);
    if (!company) {
      return res.status(400).json({ message: "Company not found" });
    }

    const newProject = await Project.create({ ...projectData, companyId });
    res.status(201).json(newProject);
  } catch (error) {
    console.error("Error creating project:", error);
    res
      .status(500)
      .json({ message: "Failed to create project", error: error.errors });
  }
};

// GET ALL PROJECTS (potentially filterable by company)
exports.getAllProjects = async (req, res) => {
  try {
    const whereClause = { deletedAt: null };
    if (req.query.companyId) {
      whereClause.companyId = req.query.companyId;
    }
    const projects = await Project.findAll({
      where: whereClause,
      include: [{ model: Company, as: "company" }], // Include company details
    });
    res.status(200).json(projects);
  } catch (error) {
    console.error("Error fetching projects:", error);
    res.status(500).json({ message: "Failed to fetch projects" });
  }
};

// GET PROJECT BY ID
exports.getProjectById = async (req, res) => {
  try {
    const project = await Project.findByPk(req.params.id, {
      where: { deletedAt: null },
      include: [{ model: Company, as: "company" }], // Include company details
    });
    if (!project) {
      return res.status(404).json({ message: "Project not found" });
    }
    res.status(200).json(project);
  } catch (error) {
    console.error("Error fetching project by ID:", error);
    res.status(500).json({ message: "Failed to fetch project" });
  }
};

// UPDATE PROJECT BY ID
exports.updateProject = async (req, res) => {
  try {
    const { companyId, ...projectData } = req.body;
    const projectId = req.params.id;

    // Check if the project exists and is not deleted
    const existingProject = await Project.findByPk(projectId, { where: { deletedAt: null } });
    if (!existingProject) {
      return res.status(404).json({ message: "Project not found" });
    }

    // If companyId is provided, check if the company exists
    if (companyId) {
      const company = await Company.findByPk(companyId);
      if (!company) {
        return res.status(400).json({ message: "Company not found" });
      }
      await Project.update({ ...projectData, companyId }, {
        where: { id: projectId, deletedAt: null },
      });
    } else {
      await Project.update(projectData, {
        where: { id: projectId, deletedAt: null },
      });
    }

    const updatedProject = await Project.findByPk(projectId, { include: [{ model: Company, as: "company" }] });
    res.status(200).json(updatedProject);
  } catch (error) {
    console.error("Error updating project:", error);
    res
      .status(500)
      .json({ message: "Failed to update project", error: error.errors });
  }
};

// SOFT DELETING
exports.softDeleteProject = async (req, res) => {
  await softDelete(Project, req.params.id, res);
};

// Get all Projects for a specific company
exports.getProjectsByCompany = async (req, res) => {
  const { companyId } = req.params;
  try {
    const company = await Company.findByPk(companyId);
    if (!company) {
      return res.status(404).json({ message: "Company not found" });
    }

    const projects = await Project.findAll({
      where: { companyId: companyId, deletedAt: null },
      include: [{ model: Company, as: "company" }],
    });
    res.status(200).json(projects);
  } catch (error) {
    console.error("Error fetching projects by company:", error);
    res
      .status(500)
      .json({ message: "Failed to fetch projects for this company" });
  }
};



