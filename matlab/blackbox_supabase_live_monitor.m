% Smart Vehicle Blackbox - MATLAB Supabase Live Monitor
% Reads live ESP32 values from Supabase table: public.live_telemetry
%
% Before running:
%   1. Copy supabase_config_template.m to supabase_config.m
%   2. Put your Supabase URL and publishable key in supabase_config.m
%   3. Run this file:
%      blackbox_supabase_live_monitor

clear;
clc;
close all;

if exist('supabase_config', 'file') ~= 2
    error(['Missing supabase_config.m. Copy matlab/supabase_config_template.m ', ...
           'to matlab/supabase_config.m and fill your Supabase values.']);
end

config = supabase_config();

crashThresholdG = 2.0;
potholeThresholdG = 1.8;

sampleIndex = 0;
latHistory = [];
lngHistory = [];

% ---------------- Figure Layout ----------------
fig = figure( ...
    'Name', 'Supabase Live ESP32 Blackbox Monitor', ...
    'Color', [0.94 0.95 0.97], ...
    'NumberTitle', 'off');

layout = tiledlayout(fig, 2, 2, ...
    'TileSpacing', 'compact', ...
    'Padding', 'compact');

% ---------------- GPS Track ----------------
mapAx = nexttile(layout, 1);
hold(mapAx, 'on');
grid(mapAx, 'on');
title(mapAx, 'Live GPS From Supabase');
xlabel(mapAx, 'Longitude');
ylabel(mapAx, 'Latitude');
trackLine = animatedline(mapAx, 'Color', [0.1 0.35 0.85], 'LineWidth', 2);
vehicleMarker = plot(mapAx, NaN, NaN, 'o', ...
    'MarkerFaceColor', [0.1 0.7 0.35], ...
    'MarkerEdgeColor', 'k', ...
    'MarkerSize', 9);

% ---------------- Acceleration Plot ----------------
accAx = nexttile(layout, 2);
hold(accAx, 'on');
grid(accAx, 'on');
title(accAx, 'Live Acceleration');
xlabel(accAx, 'Sample');
ylabel(accAx, 'g');
axLine = animatedline(accAx, 'Color', [0.1 0.35 0.85], 'LineWidth', 1.8);
ayLine = animatedline(accAx, 'Color', [0.05 0.6 0.25], 'LineWidth', 1.8);
azLine = animatedline(accAx, 'Color', [0.85 0.1 0.1], 'LineWidth', 1.8);
yline(accAx, crashThresholdG, '--r', 'Crash threshold');
legend(accAx, {'ax', 'ay', 'az'}, 'Location', 'northwest');

% ---------------- Gyroscope Plot ----------------
gyroAx = nexttile(layout, 3);
hold(gyroAx, 'on');
grid(gyroAx, 'on');
title(gyroAx, 'Live Gyroscope');
xlabel(gyroAx, 'Sample');
ylabel(gyroAx, 'degree/s');
gxLine = animatedline(gyroAx, 'Color', [0.45 0.2 0.85], 'LineWidth', 1.8);
gyLine = animatedline(gyroAx, 'Color', [0.9 0.55 0.05], 'LineWidth', 1.8);
gzLine = animatedline(gyroAx, 'Color', [0.0 0.55 0.65], 'LineWidth', 1.8);
legend(gyroAx, {'gx', 'gy', 'gz'}, 'Location', 'northwest');

% ---------------- Status Panel ----------------
statusAx = nexttile(layout, 4);
axis(statusAx, 'off');
title(statusAx, 'Supabase Live Status');
statusText = text(statusAx, 0.05, 0.86, 'Waiting for Supabase...', ...
    'FontSize', 18, 'FontWeight', 'bold');
speedText = text(statusAx, 0.05, 0.70, '', 'FontSize', 13);
gpsText = text(statusAx, 0.05, 0.58, '', 'FontSize', 11);
sensorText = text(statusAx, 0.05, 0.40, '', 'FontSize', 11);
eventText = text(statusAx, 0.05, 0.16, '', 'FontSize', 14, 'FontWeight', 'bold');

disp('Reading live_telemetry from Supabase. Close the figure to stop.');

while ishandle(fig)
    try
        row = readLiveTelemetry(config);

        if isempty(row)
            set(statusText, 'String', 'No live row found', 'Color', [0.75 0.4 0.0]);
            set(eventText, 'String', 'Check device_id and table data', 'Color', [0.75 0.4 0.0]);
            drawnow;
            pause(config.pollSeconds);
            continue;
        end

        sampleIndex = sampleIndex + 1;

        status = string(row.status);
        severity = string(row.severity);
        impactMagnitude = valueOrDefault(row, 'impact_magnitude', computeImpact(row));

        markerColor = [0.1 0.7 0.35];
        statusColor = [0.0 0.45 0.2];
        eventMessage = "Normal driving";

        if status == "CRASH" || impactMagnitude > crashThresholdG
            markerColor = [0.9 0.05 0.05];
            statusColor = [0.75 0.05 0.05];
            eventMessage = "CRASH DETECTED - Supabase live";
        elseif abs(valueOrDefault(row, 'az', 0)) > potholeThresholdG
            markerColor = [0.95 0.6 0.05];
            statusColor = [0.75 0.4 0.0];
            eventMessage = "POTHOLE / ROAD SHOCK DETECTED";
        elseif abs(valueOrDefault(row, 'ax', 0)) > 0.8 || abs(valueOrDefault(row, 'ay', 0)) > 0.8
            markerColor = [0.95 0.6 0.05];
            statusColor = [0.75 0.4 0.0];
            eventMessage = "Vehicle tilt / hard braking";
        end

        lat = valueOrDefault(row, 'lat', NaN);
        lng = valueOrDefault(row, 'lng', NaN);

        if ~isnan(lat) && ~isnan(lng)
            latHistory(end + 1) = lat; %#ok<SAGROW>
            lngHistory(end + 1) = lng; %#ok<SAGROW>
            addpoints(trackLine, lng, lat);
            set(vehicleMarker, 'XData', lng, 'YData', lat, 'MarkerFaceColor', markerColor);

            axis(mapAx, [min(lngHistory)-0.0002, max(lngHistory)+0.0002, ...
                         min(latHistory)-0.0002, max(latHistory)+0.0002]);
        end

        addpoints(axLine, sampleIndex, valueOrDefault(row, 'ax', 0));
        addpoints(ayLine, sampleIndex, valueOrDefault(row, 'ay', 0));
        addpoints(azLine, sampleIndex, valueOrDefault(row, 'az', 0));

        addpoints(gxLine, sampleIndex, valueOrDefault(row, 'gx', 0));
        addpoints(gyLine, sampleIndex, valueOrDefault(row, 'gy', 0));
        addpoints(gzLine, sampleIndex, valueOrDefault(row, 'gz', 0));

        if sampleIndex > config.maxSamples
            xlim(accAx, [sampleIndex - config.maxSamples, sampleIndex]);
            xlim(gyroAx, [sampleIndex - config.maxSamples, sampleIndex]);
        end

        set(statusText, 'String', sprintf('%s  |  Severity: %s', status, severity), 'Color', statusColor);
        set(speedText, 'String', sprintf('Speed: %.1f km/h     Satellites: %d', ...
            valueOrDefault(row, 'speed', 0), round(valueOrDefault(row, 'satellites', 0))));
        set(gpsText, 'String', sprintf('GPS: %.6f, %.6f     Device: %s', ...
            lat, lng, string(row.device_id)));
        set(sensorText, 'String', sprintf( ...
            'Impact: %.2f g\nax %.2f | ay %.2f | az %.2f\ngx %.2f | gy %.2f | gz %.2f', ...
            impactMagnitude, ...
            valueOrDefault(row, 'ax', 0), valueOrDefault(row, 'ay', 0), valueOrDefault(row, 'az', 0), ...
            valueOrDefault(row, 'gx', 0), valueOrDefault(row, 'gy', 0), valueOrDefault(row, 'gz', 0)));
        set(eventText, 'String', eventMessage, 'Color', statusColor);

        drawnow;
    catch err
        set(statusText, 'String', 'Supabase read error', 'Color', [0.75 0.05 0.05]);
        set(eventText, 'String', err.message, 'Color', [0.75 0.05 0.05]);
        drawnow;
    end

    pause(config.pollSeconds);
end

disp('Live monitor stopped.');

% ---------------- Local Functions ----------------
function row = readLiveTelemetry(config)
    endpoint = config.url + "/rest/v1/live_telemetry" + ...
        "?select=*&device_id=eq." + config.deviceId + "&limit=1";

    options = weboptions( ...
        'HeaderFields', { ...
            'apikey', char(config.key); ...
            'Authorization', char("Bearer " + config.key); ...
            'Accept', 'application/json' ...
        }, ...
        'Timeout', 10);

    response = webread(char(endpoint), options);

    if isempty(response)
        row = [];
        return;
    end

    if isstruct(response) && numel(response) >= 1
        row = response(1);
    else
        row = [];
    end
end

function value = valueOrDefault(row, fieldName, fallback)
    if isfield(row, fieldName) && ~isempty(row.(fieldName))
        value = row.(fieldName);
    else
        value = fallback;
    end
end

function impact = computeImpact(row)
    ax = valueOrDefault(row, 'ax', 0);
    ay = valueOrDefault(row, 'ay', 0);
    az = valueOrDefault(row, 'az', 0);
    impact = sqrt(ax * ax + ay * ay + az * az);
end
