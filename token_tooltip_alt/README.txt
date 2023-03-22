The contents of this directory can be used to set up token tooltip alt to display unit information.
Players do not see tooltips for their own units, as the tooltips can be disruptive when moving around a map.

The tooltips for enemy units use this module to check if the unit is scanned, revealing information if so.

USAGE:
One can import token_tooltip_alt_config.json into token tooltip alt's configuration menu.
This config contains configuratiosn for pilots, mechs, npcs, and deployables. The data source must be changed to "actor".
Scan information can be fetched using "actor.getScanned()".
The isScanned field exists on actors, but shold not be called directly as it is not always updated when the game starts (WIP). getScanned always returns an up-to-date value.