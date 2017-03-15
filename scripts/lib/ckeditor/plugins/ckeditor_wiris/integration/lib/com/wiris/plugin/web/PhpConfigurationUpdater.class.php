<?php

class com_wiris_plugin_web_PhpConfigurationUpdater implements com_wiris_plugin_configuration_ConfigurationUpdater{
	public function __construct() { 
	}
	public function updateConfiguration(&$configuration) {
		$configuration = $configuration;
		$v = null;
		$base = null;
		$base = dirname(__FILE__);
		$v = com_wiris_system_PropertiesTools::getProperty($configuration, com_wiris_plugin_api_ConfigurationKeys::$CACHE_FOLDER, null);
		if($v === null) {
			$configuration[com_wiris_plugin_api_ConfigurationKeys::$CACHE_FOLDER] = $base . "/../../../../../../cache";
		}
		$v = com_wiris_system_PropertiesTools::getProperty($configuration, com_wiris_plugin_api_ConfigurationKeys::$FORMULA_FOLDER, null);
		if($v === null) {
			$configuration[com_wiris_plugin_api_ConfigurationKeys::$FORMULA_FOLDER] = $base . "/../../../../../../formulas";
		}
		$v = com_wiris_system_PropertiesTools::getProperty($configuration, com_wiris_plugin_api_ConfigurationKeys::$SHOWIMAGE_PATH, null);
		if($v === null) {
			$configuration[com_wiris_plugin_api_ConfigurationKeys::$SHOWIMAGE_PATH] = "integration/showimage.php?formula=";
		}
		$v = com_wiris_system_PropertiesTools::getProperty($configuration, com_wiris_plugin_api_ConfigurationKeys::$SHOWCASIMAGE_PATH, null);
		if($v === null) {
			$configuration[com_wiris_plugin_api_ConfigurationKeys::$SHOWCASIMAGE_PATH] = "integration/showcasimage.php?formula=";
		}
		$v = com_wiris_system_PropertiesTools::getProperty($configuration, com_wiris_plugin_api_ConfigurationKeys::$CONTEXT_PATH, null);
		if($v === null) {
			$filePath = dirname(dirname($_SERVER['SCRIPT_NAME']));
			$configuration[com_wiris_plugin_api_ConfigurationKeys::$CONTEXT_PATH] = $filePath . "/";
		}
		$v = com_wiris_system_PropertiesTools::getProperty($configuration, com_wiris_plugin_api_ConfigurationKeys::$CONFIGURATION_PATH, null);
		if($v === null) {
			$configuration[com_wiris_plugin_api_ConfigurationKeys::$CONFIGURATION_PATH] = $base . "/../../../../../..";
		}
	}
	public function init($obj) {
	}
	function __toString() { return 'com.wiris.plugin.web.PhpConfigurationUpdater'; }
}