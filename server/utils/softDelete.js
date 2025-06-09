const softDelete = async (Model, id, res) => {
    try {
        const record = await Model.findByPk(id);
        if (!record) {
            return res.status(404).json({ message: `${Model.name} not found` });
        }
        await record.update({ deletedAt: new Date() });
        return res.status(200).json({ message: `${Model.name} soft-deleted successfully` });
    } catch (error) {
        console.error(`Error soft-deleting ${Model.name}:`, error);
        return res.status(500).json({ message: `Failed to soft-delete ${Model.name}` });
    }
};

module.exports = softDelete;