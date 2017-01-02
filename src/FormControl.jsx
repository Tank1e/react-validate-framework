/**
 * Created by MingYi on 2016/12/23.
 */

import React, { Component, PropTypes } from 'react';
import Validator from 'validate-framework-utils';

/**
 * React form 验证组件
 * @param schemas 验证规则
 * @param methods 扩展验证方法
 * @return Component
 */
export default (schemas, methods) => FormComponent => (

  /**
   * 验证组件
   */
  class FormControl extends Component {

    static propTypes = {
      values: PropTypes.object.isRequired,
      classNames: PropTypes.object,
    };

    static defaultProps = {
      classNames: {},
    };

    constructor(props) {
      super(props);
      const { classNames, values } = props;

      // 将初始化数据组装成 fields
      const fields = {};
      Object.keys(values).forEach((name) => {
        fields[name] = {
          className: classNames.static,
          value: values[name],
        };
      });

      this.state = {
        fields,
      };

      // 初始化验证组件并自定义验证方法
      this.validator = new Validator().addMethods(methods);
    }

    componentWillReceiveProps(nextProps) {
      // 从父组件中更新 state
      const { values } = nextProps;
      const { classNames } = this.props;
      const { fields } = this.state;

      Object.keys(values).forEach((name) => {
        const newValue = values[name];
        // 存在，则验证新的数据
        if (fields[name]) {
          // diff 验证
          if (fields[name].value !== newValue) {
            this.assembleFieldValidate(name, newValue);
          }
        } else {
          // 不存在，则添加新的 field
          fields[name] = {
            className: classNames.static,
            value: newValue,
          };
        }
      });

      this.setState({
        fields,
      });
    }

    /**
     * 获取表单值列表
     * @return {Object}
     */
    get formValues() {
      const { fields } = this.state;
      const values = {};
      Object.keys(fields).forEach((name) => {
        values[name] = fields[name].value;
      });
      return values;
    }

    /**
     * 获取整体验证状态
     * @return {Boolean}
     */
    get isAllValid() {
      const { fields } = this.state;
      return Object.keys(schemas).every(name => fields[name].result);
    }

    /**
     * 组装数据
     * 此方法不 setState
     * @param name
     * @param value
     */
    assembleFieldValidate(name, value) {
      const { classNames } = this.props;
      const { fields } = this.state;
      // 验证
      // 无 schema 则不验证
      const schema = schemas[name] && Object.assign(schemas[name], { value });
      const { result, error } = schema ? this.validator.validateByField(schema) : {};
      // 组装类名
      // 验证成功和验证失败添加相应类
      const classNameArray = [
        classNames.static,
        result ? classNames.success : null,
        result === false ? classNames.error : null,
      ];
      // 组装
      Object.assign(fields[name], {
        value,
        className: classNameArray.filter(item => item).join('\u{20}'),
        result,
        message: error ? error.message : null,
      });
    }

    /**
     * 验证单个域
     * @param name
     * @param value
     * @return {Boolean}
     */
    validateField(name, value) {
      const { fields } = this.state;
      // 组装数据
      this.assembleFieldValidate(name, value);
      return fields[name].result;
    }

    /**
     * 通过 names 验证
     * @param names
     * @return {Boolean}
     */
    validateFieldsByNames(...names) {
      const { fields } = this.state;
      let isValid = true;
      names.forEach((name) => {
        const result = this.validateField(name, fields[name].value);
        // 排除 未验证 和 验证成功
        if (result === false) {
          isValid = false;
        }
      });
      return isValid;
    }

    /**
     * 验证所有域
     * @return {Boolean}
     */
    validateFieldsAll() {
      const names = Object.keys(schemas);
      return this.validateFieldsByNames(...names);
    }

    // 表单改变事件监听
    handleChange = (e) => {
      const { name, type, value } = e.target;
      const { fields } = this.state;

      // 依赖 name 属性
      if (!name) {
        return;
      }

      let theValue;
      // checkbox 处理
      if (type === 'checkbox') {
        theValue = fields[name].value.slice();
        const index = theValue.indexOf(value);
        if (index === -1) {
          theValue.push(value);
        } else {
          theValue.splice(index, 1);
        }
      } else {
        theValue = value;
      }

      // 验证
      this.validateField(name, theValue);

      // 同步 values 外部状态
      this.props.values[name] = theValue;
      // 更新
      this.setState({
        fields,
      });
    };

    /**
     * 添加一条或多条验证规则
     * @param schema
     */
    addSchemas = (schema) => {
      Object.assign(schemas, schema);
    };

    /**
     * 删除一条或多条验证规则
     * @param names
     */
    removeSchemas = (names) => {
      names.forEach((name) => {
        delete schemas[name]; // eslint-disable-line no-param-reassign
      });
    };

    /**
     * 添加一条或多条域
     * @param newFields
     */
    addFields = (newFields) => {
      const { classNames } = this.props;
      const { fields } = this.state;
      Object.keys(newFields).forEach((name) => {
        Object.assign(newFields[name], {
          className: classNames.static,
        });
      });
      // 组装
      Object.assign(fields, newFields);
      // 更新
      this.setState({
        fields,
      });
    };

    /**
     * 删除一条或多条域
     * @param names
     */
    removeFields = (names) => {
      const { fields } = this.state;
      names.forEach((name) => {
        delete fields[name];
      });
      // 更新
      this.setState({
        fields,
      });
    };

    /**
     * 通过 names 验证组件
     * @param names
     * @return {Boolean}
     */
    validateByNames = (...names) => {
      const result = this.validateFieldsByNames(...names);
      const { fields } = this.state;
      // 更新
      this.setState({
        fields,
      });
      return result;
    };

    // 验证所有
    validate = () => {
      // 验证
      const result = this.validateFieldsAll();
      const { fields } = this.state;
      // 更新
      this.setState({
        fields,
      });
      return result;
    };

    render() {
      const { fields } = this.state;

      return (
        <FormComponent
          {...this.props}
          fields={fields}
          isAllValid={this.isAllValid}
          formValues={this.formValues}
          onChange={this.handleChange}
          validate={this.validate}
          validateByNames={this.validateByNames}
          addFields={this.addFields}
          removeFields={this.removeFields}
          addSchemas={this.addSchemas}
          removeSchemas={this.removeSchemas}
        />
      );
    }
  }
);
