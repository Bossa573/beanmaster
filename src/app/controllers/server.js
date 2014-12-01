/**
 * Created by Bossa on 14/11/30.
 */
var validator = require('validator');
var _ = require('lodash');
var BeanstalkConfigManager = require('../../lib/beanstalk_config_manager');
var fivebeans = require('fivebeans');

/**
 * list all the beanstalk tubes
 * @param req
 * @param res
 */
exports.listServerTubes = function(req, res) {

	var host_port = req.params.host_port || null;

	if (!host_port) {
		res.redirect('/');
	} else {
		host_port = host_port.split(':');
		if (host_port.length !== 2) {
			res.redirect('/');
		} else {
			if ((!validator.isURL(host_port[0]) && !validator.isIP(host_port[0])) || !validator.isNumeric(host_port[1])) {
				res.redirect('/');
			} else {

				//get the connection name
				BeanstalkConfigManager.getConfig(function(err, config){

					//connect to beanstalk
					var saved_config = _.find(config, {host: host_port[0], port: host_port[1]});
					var name = saved_config?saved_config.name:null;

					res.render('server/list', {
						page: 'Servers',
						title: 'Servers',
						name: name,
						host: host_port[0],
						port: host_port[1]
					});
				});
			}
		}
	}
};

/**
 * get server tubes info in json format
 * @param req
 * @param res
 */
exports.refreshServerTubes = function(req, res) {
	var host_port = req.params.host_port || null;

	res.json({
		host_port: host_port
	});

};

/**
 * show tube detail
 * @param req
 * @param res
 */
exports.tube = function(req, res) {

};