"use strict";

var g_nLoadedBestTimes = 0;
var g_nTournamentSeed = 0;
var g_hBestTimes = null;

function UpdateTopBar()
{
	UpdateGameTimers();
	UpdateRespawnsRemaining();
	$.Schedule( 1.0, UpdateTopBar );
}

function UpdateGameTimers()
{
	if ( g_nLoadedBestTimes == 0 )
	{
		g_nLoadedBestTimes = 1;
		var hTournamentMode = CustomNetTables.GetTableValue( "game_global", "tournament_mode" );
		g_nTournamentSeed = hTournamentMode ? Number( hTournamentMode["1"] ) : 0;
		if ( g_nTournamentSeed != 0 )
		{
			g_hBestTimes = GameUI.LoadPersistentEventGameData();	
			if ( g_hBestTimes == null )
			{
				g_hBestTimes = {};				
			}
			if ( g_hBestTimes[ g_nTournamentSeed.toString() ] == null )
			{
				g_hBestTimes[ g_nTournamentSeed.toString() ] = {};				
			}	
			$.GetContextPanel().AddClass( "IsInTournamentMode" );				
		}
	}
	var secondsRaw = Math.floor( Game.GetGameTime() ) ;
	var expeditionStartTime = CustomNetTables.GetTableValue( "game_global", "expedition_start_time" );
	if ( expeditionStartTime == null )
	{
		secondsRaw = 0;
	}
	else
	{
		secondsRaw = secondsRaw - Number( expeditionStartTime["1"] );
		if ( secondsRaw < 0 )
		{
			secondsRaw = 0;
		}
	}

	var minutes = Math.floor( secondsRaw / 60 );
	var seconds = Math.floor( secondsRaw - minutes * 60 + 0.5 );
	$.GetContextPanel().FindChildInLayoutFile( "GameTimer" ).text = Math.floor( minutes ) + ":" + ( "0" + seconds ).slice(-2);

	if ( g_hBestTimes != null )
	{
		var Depth = CustomNetTables.GetTableValue( "encounter_state", "depth_started" );
		var nCurrentDepth = Depth ? Number( Depth[ "1" ] ) : 1;
		var bBestTime = g_hBestTimes[ g_nTournamentSeed.toString() ][ (nCurrentDepth + 1).toString() ] == null;
		var bHasComparisonData = !bBestTime;
		if ( bBestTime == true && g_hBestTimes[ g_nTournamentSeed.toString() ][ nCurrentDepth.toString() ] != null )
		{
			// In this case, we're on our deepest room.
			var hEncounterData = CustomNetTables.GetTableValue( "encounter_state", nCurrentDepth.toString() );
			if ( hEncounterData != null && hEncounterData[ "start_time" ] != null )
			{
				bBestTime = hEncounterData[ "start_time" ] < Number( g_hBestTimes[ g_nTournamentSeed.toString() ][ nCurrentDepth.toString() ] );
			}
		}
		$.GetContextPanel().SetHasClass( "DeepestRun", bBestTime );
		$.GetContextPanel().SetHasClass( "HasComparisonData", bHasComparisonData );
		if ( bHasComparisonData ) 
		{
			var flBestSecondsRaw = g_hBestTimes[ g_nTournamentSeed.toString() ][ (nCurrentDepth + 1).toString() ];
			var nBestMinutes = Math.floor( flBestSecondsRaw / 60 );
			var nBestSeconds = Math.floor( flBestSecondsRaw - nBestMinutes * 60 + 0.5 );
			$.GetContextPanel().SetHasClass( "FasterRun", flBestSecondsRaw >= secondsRaw );
			$( '#BestRunInfo' ).SetDialogVariable( "best_run_time", nBestMinutes + ":" + ( "0" + nBestSeconds ).slice(-2) );
 
			var flRelSecondsRaw = secondsRaw - flBestSecondsRaw;
			var bNegative = ( flRelSecondsRaw < 0 ) ? 1 : 0;
			flRelSecondsRaw = Math.abs( flRelSecondsRaw ); 
			var nRelMinutes = Math.floor( flRelSecondsRaw / 60 );
			var nRelSeconds = Math.floor( flRelSecondsRaw - nRelMinutes * 60 + 0.5 );
			$( '#BestRunRelInfo' ).SetDialogVariable( "best_rel_run_time", ( bNegative ? "-" : "+" ) + nRelMinutes + ":" + ( "0" + nRelSeconds ).slice(-2) );
		}
	}
}

function OnTournamentGameEnded( table_name, key, data )
{
	if ( g_hBestTimes == null )
		return;

	if ( data == null || key != "tournament_end_score" )
		return;

	var nTournamentScore = Number( data[ "score" ] );

	if ( ( g_hBestTimes[ g_nTournamentSeed.toString() ][ "best_score" ] != null ) &&
		( Number( g_hBestTimes[ g_nTournamentSeed.toString() ][ "best_score" ] ) <= nTournamentScore ) )
		return;

	var hTournamentTable = {};
	hTournamentTable[ "best_score" ] = nTournamentScore;

	var Depth = CustomNetTables.GetTableValue( "encounter_state", "depth_started" );
	var nCurrentDepth = Depth ? Number( Depth[ "1" ] ) : 1;

	for ( var i = 1; i <= nCurrentDepth; ++i )
	{
		var hEncounterData = CustomNetTables.GetTableValue( "encounter_state", i.toString() );
		if ( hEncounterData == null || hEncounterData[ "start_time" ] == null )
			continue;

		hTournamentTable[ i.toString() ] = hEncounterData[ "start_time" ];
	}
	if ( Number( data[ "won_game" ] ) != 0 )
	{
		hTournamentTable[ (nCurrentDepth+1).toString() ] = data[ "end_time" ];	
	}

	g_hBestTimes[ g_nTournamentSeed.toString() ] = hTournamentTable
	GameUI.SavePersistentEventGameData( g_hBestTimes );	
}

CustomNetTables.SubscribeNetTableListener( "game_global", OnTournamentGameEnded );

CustomNetTables.SubscribeNetTableListener( "respawns_remaining", UpdateRespawnsRemaining )

function UpdateRespawnsRemaining()
{
	var vecPlayers = Game.GetPlayerIDsOnTeam( DOTATeam_t.DOTA_TEAM_GOODGUYS );

	if( vecPlayers == null )
		return

	for ( var szPlayerID in vecPlayers )
	{
		var nPlayerID = Number(szPlayerID);
		var playerHeroEntIndex = Players.GetPlayerHeroEntityIndex( nPlayerID );
		//$.Msg(" updating respawns for hero "+nPlayerID+" "+playerHeroEntIndex );
		var respawnData = CustomNetTables.GetTableValue( "respawns_remaining", playerHeroEntIndex.toString() );
		
		if ( respawnData == null )
			continue;

		var nRespawnsRemaining = respawnData["respawns"]
		var partyPortraitPanelName = "PartyPortrait"+nPlayerID;
		var playerPortrait = $( "#PartyPortraits" ).FindChildTraverse(partyPortraitPanelName);

		if( playerPortrait )
		{
			playerPortrait.SetDialogVariableInt( "respawns_remaining", nRespawnsRemaining );
			playerPortrait.SetHasClass("DataFilled", true);
		}
	}
}

$.Schedule( 1.0, UpdateTopBar );

function UpdateRoomData()
{
	//$.Msg("Updating room data");
	UpdateEnrageTimer()
}

function UpdateEnrageTimer()
{
	var EnrageTimer = CustomNetTables.GetTableValue( "room_data", "enrage_timer" );	
	var Status = CustomNetTables.GetTableValue( "room_data", "status" );	

	var bEnrageTimerActive = Status && !Status.complete && EnrageTimer ? EnrageTimer.active : false;

	$( "#EnrageTimerContainer").SetHasClass("Visible", bEnrageTimerActive);
	//$.Msg("Updating enrage timer "+JSON.stringify(EnrageTimer));	
	if( bEnrageTimerActive )
	{
		var flNow = Game.GetGameTime()
		var flValue = Math.min(100, 100*(flNow - EnrageTimer.startTime)/EnrageTimer.enrageTimer );
		$( "#EnrageTimerProgressBar" ).value = flValue;
		//$.Msg("Updating enrage timer at "+flNow+" "+EnrageTimer.startTime+" pct "+ flValue);
		$.Schedule( 0.1, UpdateEnrageTimer );
	}
}

CustomNetTables.SubscribeNetTableListener( "room_data", UpdateRoomData );