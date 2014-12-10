/**
 * Created by Bossa on 14/11/30.
 */

var _ = require('lodash'),
	async = require('async'),
	Utility = require('../../lib/utility');

var BeanstalkConfigManager = require('../../lib/beanstalk_config_manager'),
	BeanstalkConnectionManager = require('../../lib/beanstalk_connection_manager');

function getTubesInfo(connection, callback) {

	async.waterfall([

		//get the tubes
		function(flow_callback) {
			connection.list_tubes(function(err, tubes) {
				flow_callback(err, tubes)
			});
		},

		function(tubes, flow_callback) {

			async.mapSeries(tubes, function(tube, tube_callback) {

				connection.stats_tube(tube, function(err, tube_data) {
					tube_callback(err, tube_data);
				});

			}, function(err, results) {
				flow_callback(err, results)
			});
		}

	], function(err, results) {

		if (results) {
			results = _.sortBy(results, 'name');
		}

		var result_map = {};

		for (var i = 0; i < results.length; i++) {
			result_map[results[i].name] = results[i];
		}

		callback(err, result_map);
	});
}

/**
 * list all the beanstalk tubes
 * @param req
 * @param res
 */
exports.listTubes = function(req, res) {

	var host_port = Utility.validateHostPort(req.params.host_port);

	if (host_port) {
		//get the connection name
		BeanstalkConfigManager.getConfig(function(err, config) {
			if (err) {
				res.redirect('/');
			} else {
				//connect to beanstalk
				var saved_config = _.find(config, {host: host_port[0], port: host_port[1]});
				var name = saved_config ? saved_config.name : null;

				BeanstalkConnectionManager.getConnection(host_port[0], host_port[1], function(err, connection) {
					if (err) {
						res.redirect('/');
					} else {
						getTubesInfo(connection, function(err, tubes_info) {
							res.render('server/list', {
								page: 'servers',
								title: 'Beanmaster - ' + host_port[0] + ':' + host_port[1],
								name: name,
								host: host_port[0],
								port: host_port[1],
								err: err,
								tubes_info: tubes_info
							});
						});
					}
				});
			}
		});
	} else {
		res.redirect('/');
	}
};

/**
 * get server tubes info in json format
 * @param req
 * @param res
 */
exports.refreshTubes = function(req, res) {
	var host_port = Utility.validateHostPort(req.params.host_port);

	BeanstalkConnectionManager.getConnection(host_port[0], host_port[1], function(err, connection) {
		if (err) {
			res.json({
				host: host_port[0],
				port: host_port[1],
				err: err
			});
		} else {
			getTubesInfo(connection, function(err, tubes_info) {
				res.json({
					host: host_port[0],
					port: host_port[1],
					err: err,
					tubes_info: tubes_info
				});
			});
		}
	});
};
