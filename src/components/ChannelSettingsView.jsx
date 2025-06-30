import React from 'react';
import styles from './ChannelSettingsView.module.css';

const ChannelSettingsView = ({ channel }) => {
  return (
    <div className={styles.settingsContainer}>
      <h2>Channel Settings</h2>
      <div className={styles.formGroup}>
        <strong>Channel ID: </strong>{channel.id}
        {/* <input type="text" value={channel.id} readOnly /> */}
      </div>

      <div className={styles.formGroup}>
        <label>Name</label>
        <input type="text" value={channel.name} readOnly />
      </div>

      <div className={styles.formGroup}>
        <label>Description</label>
        <textarea value={channel.description} readOnly />
      </div>

      {[...Array(8)].map((_, index) => {
        const fieldKey = `field${index + 1}`;
        return (
          <div key={index} className={styles.formGroup}>
            <label>{`Field ${index + 1}`}</label>
            <div className={styles.inlineInput}>
              <input type="text" value={channel[fieldKey] || ''} readOnly />
              <input type="checkbox" checked={!!channel[fieldKey]} readOnly />
            </div>
          </div>
        );
      })}

      <div className={styles.formGroup}>
        <label>Metadata</label>
        <textarea value={channel.metadata} readOnly />
      </div>
    </div>
  );
};

export default ChannelSettingsView;
