'use strict';

const root = require('app-root-path');
const requireAll = require('require-all');

const lib = require(`${root}/lib`);
const BeanstalkConfigManager = lib.BeanstalkConfigManager;
const BeanstalkConnectionManager = lib.BeanstalkConnectionManager;

const AbstractController = require('../includes/abstract_controller');

class HomeController extends AbstractController {
	constructor(request_handlers) {
		super();
		this.wireEndpointDependencies(request_handlers, requireAll({
			dirname: `${root}/app/controllers/includes/common`,
			resolve: function (Adaptor) {
				return new Adaptor();
			}
		}));

		this.wireEndpointDependencies(request_handlers, requireAll({
			dirname: `${root}/app/controllers/includes/home`,
			resolve: function (Adaptor) {
				return new Adaptor();
			}
		}));
	}

	/**
	 *
	 * GET /
	 * server lists controller
	 * @param req
	 * @param res
	 */
	* index(req, res) {
		let configs = yield BeanstalkConfigManager.getConfig();

		res.render('home/servers', {
			page: 'Servers',
			title: 'Beanmaster',
			configs: configs
		});
	}

	* getInfo(req, res) {
		let data = this._host_port_adaptor.getData(req);

		let stat;
		let error = null;

		try {
			this._host_port_validator.validate(data);
			let connection = yield BeanstalkConnectionManager.getConnection(data.host, data.port);
			stat = yield connection.statsAsync();
		} catch (e) {
			error = e.message;
			stat = null;
		}

		res.json({
			err: error,
			stat: stat
		});
	}

	/**
	 * POST /servers/add
	 * add server
	 * @param req
	 * @param res
	 */
	* addServer(req, res) {
		let data = this._add_server_adaptor.getData(req);

		let connection_info;
		let error = null;

		try {
			this._add_server_validator.validate(data);

			yield BeanstalkConfigManager.addConfig({
				name: data.name,
				host: data.host,
				port: data.port
			});

			let connection = yield BeanstalkConnectionManager.getConnection(data.host, data.port);
			connection_info = yield connection.statsAsync();

		} catch (e) {
			error = e.message;
		}

		res.json({
			err: error,
			connection: {
				name: data.name,
				host: data.host,
				port: data.port
			},
			stat: connection_info
		});
	}

	/**
	 * POST /servers/delete
	 * delete server
	 * @param req
	 * @param res
	 */
	* deleteServer(req, res) {
		let data = this._delete_server_adaptor.getData(req);
		let error = null;
		try {
			this._delete_server_validator.validate(data);

			yield BeanstalkConfigManager.deleteConfig({
				host: data.host,
				port: data.port
			});

			BeanstalkConnectionManager.removeConnection(data.host, data.port);
		} catch (e) {
			error = e.message;
		}

		res.json({
			err: error
		});
	}
}

module.exports = new HomeController();