const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class JobDescription extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate() {
      // define association here
    }
  }

  JobDescription.init(
    {
      id: {
        type: DataTypes.UUID,
        allowNull: false,
        primaryKey: true,
        defaultValue: DataTypes.UUIDV4
      },
      file_id: {
        type: DataTypes.STRING,
        allowNull: false
      },
      job_role: {
        type: DataTypes.STRING,
        allowNull: false
      },
      content: {
        type: DataTypes.TEXT,
        allowNull: false
      },
      embedding: {
        type: DataTypes.TEXT,
        allowNull: false,
        get() {
          const raw = this.getDataValue('embedding');
          if (!raw) return null;
          return raw
            .replace(/[{}\[\]\(\)]/g, '')
            .split(',')
            .map(Number);
        },
        set(val) {
          this.setDataValue('embedding', `[${val.join(',')}]`);
        }
      }
    },
    {
      sequelize,
      modelName: 'JobDescription',
      tableName: 'job_descriptions'
    }
  );
  return JobDescription;
};
