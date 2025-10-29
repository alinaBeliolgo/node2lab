'use strict';

export async function up(queryInterface, Sequelize) {
	await queryInterface.createTable('categories', {
		id: {
			allowNull: false,
			autoIncrement: true,
			primaryKey: true,
			type: Sequelize.INTEGER
		},
		name: {
			type: Sequelize.STRING(100),
			allowNull: false
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
	await queryInterface.dropTable('categories');
}

