export default (sequelize, DataTypes) => {
    const Todo = sequelize.define(
        "Todo",
        {
            id: {
                type: DataTypes.UUID,
                defaultValue: DataTypes.UUIDV4,
                primaryKey: true,
            },
            title: {
                type: DataTypes.TEXT,
                allowNull: false,
                validate: {
                    len: {
                        args: [2, 120],
                        msg: "Длина заголовка задачи должна быть от 2 до 120 символов",
                    },
                },
            },
            completed: {
                type: DataTypes.BOOLEAN,
                defaultValue: false,
            },
            category_id: {
                type: DataTypes.INTEGER,
                allowNull: true,
                references: {
                    model: "categories",
                    key: "id",
                },
            },
            due_date: {
                type: DataTypes.DATE,
                allowNull: true,
            },
            created_at: {
                type: DataTypes.DATE,
                defaultValue: DataTypes.NOW,
            },
            updated_at: {
                type: DataTypes.DATE,
                defaultValue: DataTypes.NOW,
            },
        },
        {
            tableName: "todos",
            timestamps: false,
        }
    );
    return Todo;
};

