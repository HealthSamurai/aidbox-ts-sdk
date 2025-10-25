import type { Meta } from "@storybook/react-vite";

const meta : Meta= {
	title: "Colors",

    parameters: {
        docs: {
          autodocs: false, // overrides the default just for this story
        },
      }
} ;

export default meta;

// Small color item component - compact version
const ColorItemCompact = ({ 
  name, 
  cssVar 
}: { 
  name: string; 
  cssVar: string;
}) => {
  return (
    <div style={{
      display: 'flex',
      alignItems: 'flex-start',
      gap: '12px',
      padding: '8px 0',
    }}>
      <div style={{
        width: '32px',
        height: '32px',
        borderRadius: '4px',
        background: `var(${cssVar})`,
        flexShrink: 0,
        marginTop: '2px',
      }} />
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'flex-start',
        gap: '4px',
      }}>
        <div style={{
          fontSize: '13px',
          fontWeight: 500,
          color: '#333',
        }}>
          {name}
        </div>
        <div style={{
          fontSize: '11px',
          fontFamily: 'monospace',
          color: '#999',
        }}>
          {cssVar}
        </div>
      </div>
    </div>
  );
};

// Color group component
const ColorGroup = ({ 
  title, 
  colors 
}: { 
  title: string; 
  colors: Array<{ name: string; cssVar: string; hexValue?: string }>;
}) => {
  return (
    <div style={{ marginBottom: '48px' }}>
      <h3 style={{
        fontSize: '20px',
        fontWeight: 600,
        marginBottom: '24px',
        color: '#333',
      }}>
        {title}
      </h3>
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
        gap: '20px',
      }}>
        {colors.map((color) => (
          <ColorItemCompact key={color.cssVar} {...color} />
        ))}
      </div>
    </div>
  );
};

export const Colors = () => {
  const neutralColors = [
    { name: 'Neutral 50', cssVar: '--color-neutral-50', hexValue: '#f9f9f9' },
    { name: 'Neutral 100', cssVar: '--color-neutral-100', hexValue: '#f5f5f6' },
    { name: 'Neutral 200', cssVar: '--color-neutral-200', hexValue: '#ebecee' },
    { name: 'Neutral 300', cssVar: '--color-neutral-300', hexValue: '#ccced3' },
    { name: 'Neutral 400', cssVar: '--color-neutral-400', hexValue: '#98a1ae' },
    { name: 'Neutral 500', cssVar: '--color-neutral-500', hexValue: '#717684' },
    { name: 'Neutral 600', cssVar: '--color-neutral-600', hexValue: '#4a5565' },
    { name: 'Neutral 700', cssVar: '--color-neutral-700', hexValue: '#364153' },
    { name: 'Neutral 800', cssVar: '--color-neutral-800', hexValue: '#1e2938' },
    { name: 'Neutral 900', cssVar: '--color-neutral-900', hexValue: '#1d2331' },
    { name: 'Neutral 950', cssVar: '--color-neutral-950', hexValue: '#030712' },
  ];

  const brandColors = [
    { name: 'Brand 50', cssVar: '--color-brand-50', hexValue: '#fef7f6' },
    { name: 'Brand 100', cssVar: '--color-brand-100', hexValue: '#fdedea' },
    { name: 'Brand 200', cssVar: '--color-brand-200', hexValue: '#f9cac3' },
    { name: 'Brand 300', cssVar: '--color-brand-300', hexValue: '#f4a499' },
    { name: 'Brand 400', cssVar: '--color-brand-400', hexValue: '#ef7767' },
    { name: 'Brand 500', cssVar: '--color-brand-500', hexValue: '#ea4a35' },
    { name: 'Brand 600', cssVar: '--color-brand-600', hexValue: '#d72710' },
    { name: 'Brand 700', cssVar: '--color-brand-700', hexValue: '#c31a03' },
    { name: 'Brand 800', cssVar: '--color-brand-800', hexValue: '#78190c' },
    { name: 'Brand 900', cssVar: '--color-brand-900', hexValue: '#4a0f08' },
    { name: 'Brand 950', cssVar: '--color-brand-950', hexValue: '#2e0a05' },
  ];

  const redColors = [
    { name: 'Red 50', cssVar: '--color-red-50', hexValue: '#fef9f9' },
    { name: 'Red 100', cssVar: '--color-red-100', hexValue: '#fff6f5' },
    { name: 'Red 200', cssVar: '--color-red-200', hexValue: '#fdedea' },
    { name: 'Red 300', cssVar: '--color-red-300', hexValue: '#f4a499' },
    { name: 'Red 400', cssVar: '--color-red-400', hexValue: '#ea4a35' },
    { name: 'Red 500', cssVar: '--color-red-500', hexValue: '#d7270f' },
    { name: 'Red 600', cssVar: '--color-red-600', hexValue: '#d7270f' },
    { name: 'Red 700', cssVar: '--color-red-700', hexValue: '#c31b03' },
    { name: 'Red 800', cssVar: '--color-red-800', hexValue: '#a72d22' },
    { name: 'Red 900', cssVar: '--color-red-900', hexValue: '#7a0d00' },
    { name: 'Red 950', cssVar: '--color-red-950', hexValue: '#410801' },
  ];

  const blueColors = [
    { name: 'Blue 50', cssVar: '--color-blue-50', hexValue: '#f9fbfe' },
    { name: 'Blue 100', cssVar: '--color-blue-100', hexValue: '#f4f8fc' },
    { name: 'Blue 200', cssVar: '--color-blue-200', hexValue: '#e9f2fc' },
    { name: 'Blue 300', cssVar: '--color-blue-300', hexValue: '#d0e2f8' },
    { name: 'Blue 400', cssVar: '--color-blue-400', hexValue: '#a7c9f3' },
    { name: 'Blue 500', cssVar: '--color-blue-500', hexValue: '#2378e1' },
    { name: 'Blue 600', cssVar: '--color-blue-600', hexValue: '#045ac3' },
    { name: 'Blue 700', cssVar: '--color-blue-700', hexValue: '#014391' },
    { name: 'Blue 800', cssVar: '--color-blue-800', hexValue: '#053775' },
    { name: 'Blue 900', cssVar: '--color-blue-900', hexValue: '#052040' },
    { name: 'Blue 950', cssVar: '--color-blue-950', hexValue: '#05101e' },
  ];

  const greenColors = [
    { name: 'Green 50', cssVar: '--color-green-50', hexValue: '#fbfdf8' },
    { name: 'Green 100', cssVar: '--color-green-100', hexValue: '#f8fbf3' },
    { name: 'Green 200', cssVar: '--color-green-200', hexValue: '#f1f8e6' },
    { name: 'Green 300', cssVar: '--color-green-300', hexValue: '#e3efcb' },
    { name: 'Green 400', cssVar: '--color-green-400', hexValue: '#c9e19b' },
    { name: 'Green 500', cssVar: '--color-green-500', hexValue: '#78b506' },
    { name: 'Green 600', cssVar: '--color-green-600', hexValue: '#558300' },
    { name: 'Green 700', cssVar: '--color-green-700', hexValue: '#334e02' },
    { name: 'Green 800', cssVar: '--color-green-800', hexValue: '#1d2b03' },
    { name: 'Green 900', cssVar: '--color-green-900', hexValue: '#090d04' },
    { name: 'Green 950', cssVar: '--color-green-950', hexValue: '#090d04' },
  ];

  const yellowColors = [
    { name: 'Yellow 50', cssVar: '--color-yellow-50', hexValue: '#fffdf2' },
    { name: 'Yellow 100', cssVar: '--color-yellow-100', hexValue: '#fffbe5' },
    { name: 'Yellow 200', cssVar: '--color-yellow-200', hexValue: '#fff9d9' },
    { name: 'Yellow 300', cssVar: '--color-yellow-300', hexValue: '#fff4bf' },
    { name: 'Yellow 400', cssVar: '--color-yellow-400', hexValue: '#ffea80' },
    { name: 'Yellow 500', cssVar: '--color-yellow-500', hexValue: '#ffd400' },
    { name: 'Yellow 600', cssVar: '--color-yellow-600', hexValue: '#dfa400' },
    { name: 'Yellow 700', cssVar: '--color-yellow-700', hexValue: '#855600' },
    { name: 'Yellow 800', cssVar: '--color-yellow-800', hexValue: '#562a00' },
    { name: 'Yellow 900', cssVar: '--color-yellow-900', hexValue: '#341900' },
    { name: 'Yellow 950', cssVar: '--color-yellow-950', hexValue: '#200900' },
  ];

  const greyColors = [
    { name: 'Grey 50', cssVar: '--color-grey-50', hexValue: '#fafafa' },
    { name: 'Grey 100', cssVar: '--color-grey-100', hexValue: '#f5f5f5' },
    { name: 'Grey 200', cssVar: '--color-grey-200', hexValue: '#e5e5e5' },
    { name: 'Grey 300', cssVar: '--color-grey-300', hexValue: '#d4d4d4' },
    { name: 'Grey 400', cssVar: '--color-grey-400', hexValue: '#a4a4a4' },
    { name: 'Grey 500', cssVar: '--color-grey-500', hexValue: '#767676' },
    { name: 'Grey 600', cssVar: '--color-grey-600', hexValue: '#575757' },
    { name: 'Grey 700', cssVar: '--color-grey-700', hexValue: '#434343' },
    { name: 'Grey 800', cssVar: '--color-grey-800', hexValue: '#292929' },
    { name: 'Grey 900', cssVar: '--color-grey-900', hexValue: '#1a1a1a' },
    { name: 'Grey 950', cssVar: '--color-grey-950', hexValue: '#0a0a0a' },
  ];

  const textColors = [
    { name: 'Text Primary', cssVar: '--color-text-primary' },
    { name: 'Text Secondary', cssVar: '--color-text-secondary' },
    { name: 'Text Tertiary', cssVar: '--color-text-tertiary' },
    { name: 'Text Disabled', cssVar: '--color-text-disabled' },
    { name: 'Text Link', cssVar: '--color-text-link' },
    { name: 'Text Brand Primary', cssVar: '--color-text-brand-primary' },
    { name: 'Text Error Primary', cssVar: '--color-text-error-primary' },
    { name: 'Text Success Primary', cssVar: '--color-text-success-primary' },
    { name: 'Text Warning Primary', cssVar: '--color-text-warning-primary' },
  ];

  const backgroundColors = [
    { name: 'Background Primary', cssVar: '--color-bg-primary' },
    { name: 'Background Secondary', cssVar: '--color-bg-secondary' },
    { name: 'Background Tertiary', cssVar: '--color-bg-tertiary' },
    { name: 'Background Quaternary', cssVar: '--color-bg-quaternary' },
    { name: 'Background Brand Primary', cssVar: '--color-bg-brand-primary' },
    { name: 'Background Error Primary', cssVar: '--color-bg-error-primary' },
    { name: 'Background Success Primary', cssVar: '--color-bg-success-primary' },
    { name: 'Background Warning Primary', cssVar: '--color-bg-warning-primary' },
  ];

  const borderColors = [
    { name: 'Border Primary', cssVar: '--color-border-primary' },
    { name: 'Border Secondary', cssVar: '--color-border-secondary' },
    { name: 'Border Separator', cssVar: '--color-border-separator' },
    { name: 'Border Disabled', cssVar: '--color-border-disabled' },
    { name: 'Border Brand', cssVar: '--color-border-brand' },
    { name: 'Border Link', cssVar: '--color-border-link' },
    { name: 'Border Error', cssVar: '--color-border-error' },
    { name: 'Border Success', cssVar: '--color-border-success' },
  ];

  return (
    <div style={{ padding: '40px', maxWidth: '1400px', margin: '0 auto' }}>
      <h1 style={{ 
        fontSize: '32px', 
        fontWeight: 600, 
        marginBottom: '16px',
        color: '#333',
      }}>
        Color System
      </h1>
      
      <p style={{ 
        fontSize: '16px', 
        color: '#666',
        marginBottom: '48px',
      }}>
        This page showcases all color tokens available in the design system.
      </p>

      <hr style={{ 
        margin: '48px 0', 
        border: 'none', 
        borderTop: '1px solid #e5e5e5' 
      }} />

      <ColorGroup title="Base Colors" colors={neutralColors} />
      <ColorGroup title="Brand Colors" colors={brandColors} />
      <ColorGroup title="Red Colors" colors={redColors} />
      <ColorGroup title="Blue Colors" colors={blueColors} />
      <ColorGroup title="Green Colors" colors={greenColors} />
      <ColorGroup title="Yellow Colors" colors={yellowColors} />
      <ColorGroup title="Grey Colors" colors={greyColors} />

      <hr style={{ 
        margin: '64px 0 48px 0', 
        border: 'none', 
        borderTop: '1px solid #e5e5e5' 
      }} />

      <h2 style={{
        fontSize: '28px',
        fontWeight: 600,
        marginBottom: '24px',
        color: '#333',
      }}>
        Semantic Colors
      </h2>

      <ColorGroup title="Text Colors" colors={textColors} />
      <ColorGroup title="Background Colors" colors={backgroundColors} />
      <ColorGroup title="Border Colors" colors={borderColors} />

      <hr style={{ 
        margin: '64px 0 48px 0', 
        border: 'none', 
        borderTop: '1px solid #e5e5e5' 
      }} />


      <h2 style={{
        fontSize: '28px',
        fontWeight: 600,
        marginBottom: '24px',
        color: '#333',
      }}>
        Usage Guidelines
      </h2>

      <div style={{ fontSize: '14px', lineHeight: '1.8', color: '#666' }}>
        <pre style={{
          background: '#f5f5f5',
          padding: '16px',
          borderRadius: '8px',
          overflow: 'auto',
          fontSize: '13px',
          fontFamily: 'monospace',
          color: '#333',
        }}>
{`/* ✅ Good - Using semantic tokens */
.button {
  background: var(--color-bg-brand-primary);
  color: var(--color-text-primary);
  border: 1px solid var(--color-border-primary);
}

/* ❌ Bad - Using base colors directly */
.button {
  background: var(--color-brand-50);
  color: var(--color-neutral-900);
  border: 1px solid var(--color-neutral-300);
}`}
        </pre>
      </div>
    </div>
  );
};
