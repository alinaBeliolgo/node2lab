'use strict';

export async function up(queryInterface, Sequelize) {
	await queryInterface.createTable('todos', {
		id: {
			allowNull: false,
			primaryKey: true,
			type: Sequelize.UUID,
			defaultValue: Sequelize.literal('gen_random_uuid()')
		},
		title: {
			type: Sequelize.TEXT,
			allowNull: false
		},
		completed: {
			type: Sequelize.BOOLEAN,
			defaultValue: false
		},
			category_id: {
				type: Sequelize.INTEGER,
				references: {
					model: 'categories',
					key: 'id'
				},
				onUpdate: 'CASCADE',
				onDelete: 'SET NULL'
			},
		due_date: {
			type: Sequelize.DATE
		},
		created_at: {
			allowNull: false,
			type: Sequelize.DATE
		},
		updated_at: {
			allowNull: false,
			type: Sequelize.DATE
		}
	});
}

export async function down(queryInterface, Sequelize) {
	await queryInterface.dropTable('todos');
}

