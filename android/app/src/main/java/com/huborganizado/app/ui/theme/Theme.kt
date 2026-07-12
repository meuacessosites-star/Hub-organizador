package com.huborganizado.app.ui.theme

import android.app.Activity
import androidx.compose.foundation.isSystemInDarkTheme
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.darkColorScheme
import androidx.compose.material3.lightColorScheme
import androidx.compose.runtime.Composable
import androidx.compose.runtime.SideEffect
import androidx.compose.ui.graphics.toArgb
import androidx.compose.ui.platform.LocalView
import androidx.core.view.WindowCompat

private val DarkColorScheme = darkColorScheme(
    primary = IndigoPrimary,
    secondary = GreyText,
    tertiary = IndigoPrimary,
    background = CharcoalDark,
    surface = SurfaceDark,
    onPrimary = WhiteBackground,
    onSecondary = WhiteBackground,
    onTertiary = WhiteBackground,
    onBackground = WhiteBackground,
    onSurface = WhiteBackground,
)

private val LightColorScheme = lightColorScheme(
    primary = IndigoPrimary,
    secondary = GreyText,
    tertiary = IndigoPrimary,
    background = WhiteBackground,
    surface = WhiteBackground,
    onPrimary = WhiteBackground,
    onSecondary = CharcoalDark,
    onTertiary = WhiteBackground,
    onBackground = CharcoalDark,
    onSurface = CharcoalDark,
)

@Composable
fun HubOrganizadoTheme(
    darkTheme: Boolean = isSystemInDarkTheme(),
    content: @Composable () -> Unit
) {
    val colorScheme = if (darkTheme) DarkColorScheme else LightColorScheme
    val view = LocalView.current
    if (!view.isInEditMode) {
        SideEffect {
            val window = (view.context as Activity).window
            window.statusBarColor = colorScheme.background.toArgb()
            WindowCompat.getInsetsController(window, view).isAppearanceLightStatusBars = !darkTheme
        }
    }

    MaterialTheme(
        colorScheme = colorScheme,
        content = content
    )
}
